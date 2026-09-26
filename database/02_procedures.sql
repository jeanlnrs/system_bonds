-- =============================================================
--  Sistema de Bonos - Stored procedures
--  En PostgreSQL los SP que devuelven filas se implementan como
--  FUNCTION ... RETURNS TABLE. El backend solo invoca estos sp_*,
--  nunca consulta las tablas directamente.
-- =============================================================

-- -------------------------------------------------------------
--  Interno: flujos (cupones trimestrales + amortización) de
--  todas las inversiones de un cliente. Los cupones se pagan al
--  cierre de cada trimestre (31-mar, 30-jun, 30-set, 31-dic).
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_flujos_cliente(p_cliente_id INT)
RETURNS TABLE (
    bono_id   INT,
    moneda    CHAR(3),
    numero    INT,
    fecha     DATE,
    concepto  VARCHAR(20),
    monto     NUMERIC(14,2),
    estado    VARCHAR(10)
)
LANGUAGE sql STABLE AS $$
    WITH cupones AS (
        SELECT b.id AS bono_id,
               b.moneda,
               (q + INTERVAL '3 months' - INTERVAL '1 day')::date AS fecha,
               ROUND(i.valor_nominal * b.tasa_anual / 100 / 4, 2) AS monto
        FROM inversiones i
        JOIN bonos b ON b.id = i.bono_id
        CROSS JOIN LATERAL generate_series(
            date_trunc('quarter', b.fecha_emision),
            date_trunc('quarter', b.fecha_vencimiento),
            INTERVAL '3 months'
        ) AS q
        WHERE i.cliente_id = p_cliente_id
    ),
    flujos AS (
        SELECT c.bono_id, c.moneda, c.fecha, 'Cupón'::varchar AS concepto, c.monto, 1 AS orden
        FROM cupones c
        JOIN bonos b ON b.id = c.bono_id
        JOIN inversiones i ON i.bono_id = c.bono_id AND i.cliente_id = p_cliente_id
        WHERE c.fecha > b.fecha_emision
          AND c.fecha <= b.fecha_vencimiento
          AND c.fecha > i.fecha_compra
        UNION ALL
        SELECT b.id, b.moneda, b.fecha_vencimiento, 'Amortización', i.valor_nominal, 2
        FROM inversiones i
        JOIN bonos b ON b.id = i.bono_id
        WHERE i.cliente_id = p_cliente_id
    )
    SELECT f.bono_id,
           f.moneda,
           ROW_NUMBER() OVER (PARTITION BY f.bono_id ORDER BY f.fecha, f.orden)::int,
           f.fecha,
           f.concepto,
           f.monto,
           CASE WHEN f.fecha < CURRENT_DATE THEN 'Pagado' ELSE 'Pendiente' END::varchar
    FROM flujos f
$$;

-- -------------------------------------------------------------
--  Autenticación y cuenta
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_credenciales(p_correo VARCHAR)
RETURNS TABLE (id INT, password_hash VARCHAR)
LANGUAGE sql STABLE AS $$
    SELECT c.id, c.password_hash
    FROM clientes c
    WHERE lower(c.correo) = lower(trim(p_correo))
$$;

CREATE OR REPLACE FUNCTION sp_obtener_hash_cliente(p_cliente_id INT)
RETURNS TABLE (password_hash VARCHAR)
LANGUAGE sql STABLE AS $$
    SELECT c.password_hash FROM clientes c WHERE c.id = p_cliente_id
$$;

CREATE OR REPLACE FUNCTION sp_obtener_cliente(p_cliente_id INT)
RETURNS TABLE (
    id          INT,
    nombres     VARCHAR,
    apellidos   VARCHAR,
    documento   VARCHAR,
    correo      VARCHAR,
    cliente_desde DATE
)
LANGUAGE sql STABLE AS $$
    SELECT c.id, c.nombres, c.apellidos, c.documento, c.correo, c.creado_en::date
    FROM clientes c
    WHERE c.id = p_cliente_id
$$;

CREATE OR REPLACE FUNCTION sp_actualizar_correo(p_cliente_id INT, p_correo VARCHAR)
RETURNS TABLE (correo VARCHAR)
LANGUAGE plpgsql AS $$
DECLARE
    v_correo VARCHAR := lower(trim(p_correo));
BEGIN
    IF v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RAISE EXCEPTION 'CORREO_INVALIDO';
    END IF;

    IF EXISTS (SELECT 1 FROM clientes c WHERE lower(c.correo) = v_correo AND c.id <> p_cliente_id) THEN
        RAISE EXCEPTION 'CORREO_EN_USO';
    END IF;

    UPDATE clientes c
       SET correo = v_correo, actualizado_en = now()
     WHERE c.id = p_cliente_id;

    RETURN QUERY SELECT v_correo;
END;
$$;

CREATE OR REPLACE FUNCTION sp_actualizar_contrasena(p_cliente_id INT, p_password_hash VARCHAR)
RETURNS TABLE (actualizado BOOLEAN)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE clientes c
       SET password_hash = p_password_hash, actualizado_en = now()
     WHERE c.id = p_cliente_id;

    RETURN QUERY SELECT FOUND;
END;
$$;

-- -------------------------------------------------------------
--  Cartera
-- -------------------------------------------------------------

-- Resumen de la cartera (todos los bonos están en USD, así que devuelve una sola fila)
CREATE OR REPLACE FUNCTION sp_resumen_cartera(p_cliente_id INT)
RETURNS TABLE (
    moneda             CHAR(3),
    bonos              INT,
    total_invertido    NUMERIC(14,2),
    cobrado            NUMERIC(14,2),
    pendiente          NUMERIC(14,2),
    proximo_pago_fecha DATE,
    proximo_pago_monto NUMERIC(14,2)
)
LANGUAGE sql STABLE AS $$
    WITH inv AS (
        SELECT b.moneda, COUNT(*)::int AS bonos, SUM(i.monto_invertido) AS total_invertido
        FROM inversiones i
        JOIN bonos b ON b.id = i.bono_id
        WHERE i.cliente_id = p_cliente_id
        GROUP BY b.moneda
    ),
    f AS (SELECT * FROM fn_flujos_cliente(p_cliente_id)),
    prox AS (
        SELECT f.moneda, MIN(f.fecha) AS fecha
        FROM f WHERE f.estado = 'Pendiente'
        GROUP BY f.moneda
    )
    SELECT inv.moneda,
           inv.bonos,
           inv.total_invertido,
           COALESCE((SELECT SUM(f.monto) FROM f WHERE f.moneda = inv.moneda AND f.estado = 'Pagado'), 0),
           COALESCE((SELECT SUM(f.monto) FROM f WHERE f.moneda = inv.moneda AND f.estado = 'Pendiente'), 0),
           prox.fecha,
           (SELECT SUM(f.monto) FROM f WHERE f.moneda = inv.moneda AND f.fecha = prox.fecha)
    FROM inv
    LEFT JOIN prox ON prox.moneda = inv.moneda
    ORDER BY inv.moneda DESC
$$;

-- Listado de bonos del cliente con su progreso de pagos
CREATE OR REPLACE FUNCTION sp_listar_bonos(p_cliente_id INT)
RETURNS TABLE (
    id                  INT,
    serie               CHAR(1),
    nombre              VARCHAR,
    numero_serie        VARCHAR,
    sector              VARCHAR,
    emisor              VARCHAR,
    moneda              CHAR(3),
    calificacion_riesgo VARCHAR,
    tasa_anual          NUMERIC(5,2),
    fecha_vencimiento   DATE,
    valor_nominal       NUMERIC(14,2),
    monto_invertido     NUMERIC(14,2),
    estado              VARCHAR,
    cobrado             NUMERIC(14,2),
    pendiente           NUMERIC(14,2),
    pagos_realizados    INT,
    pagos_totales       INT,
    proximo_pago_fecha  DATE,
    proximo_pago_monto  NUMERIC(14,2)
)
LANGUAGE sql STABLE AS $$
    WITH f AS (SELECT * FROM fn_flujos_cliente(p_cliente_id))
    SELECT b.id,
           b.serie,
           b.nombre,
           b.numero_serie,
           b.sector,
           e.nombre,
           b.moneda,
           b.calificacion_riesgo,
           b.tasa_anual,
           b.fecha_vencimiento,
           i.valor_nominal,
           i.monto_invertido,
           (CASE WHEN b.fecha_vencimiento < CURRENT_DATE THEN 'Vencido' ELSE 'Activo' END)::varchar,
           COALESCE(SUM(f.monto) FILTER (WHERE f.estado = 'Pagado'), 0),
           COALESCE(SUM(f.monto) FILTER (WHERE f.estado = 'Pendiente'), 0),
           COUNT(*) FILTER (WHERE f.estado = 'Pagado')::int,
           COUNT(*)::int,
           MIN(f.fecha) FILTER (WHERE f.estado = 'Pendiente'),
           (SELECT SUM(f2.monto) FROM f f2
             WHERE f2.bono_id = b.id
               AND f2.fecha = MIN(f.fecha) FILTER (WHERE f.estado = 'Pendiente'))
    FROM inversiones i
    JOIN bonos b    ON b.id = i.bono_id
    JOIN emisores e ON e.id = b.emisor_id
    LEFT JOIN f     ON f.bono_id = b.id
    WHERE i.cliente_id = p_cliente_id
    GROUP BY b.id, e.nombre, i.valor_nominal, i.monto_invertido
    ORDER BY b.serie
$$;

-- Ficha completa de un bono (solo si pertenece al cliente)
CREATE OR REPLACE FUNCTION sp_detalle_bono(p_cliente_id INT, p_bono_id INT)
RETURNS TABLE (
    id                  INT,
    serie               CHAR(1),
    nombre              VARCHAR,
    numero_serie        VARCHAR,
    tipo                VARCHAR,
    sector              VARCHAR,
    emisor              VARCHAR,
    emisor_ruc          VARCHAR,
    moneda              CHAR(3),
    calificacion_riesgo VARCHAR,
    tipo_interes        VARCHAR,
    tasa_anual          NUMERIC(5,2),
    frecuencia_pago     VARCHAR,
    plazo_anios         INT,
    fecha_emision       DATE,
    fecha_vencimiento   DATE,
    fecha_compra        DATE,
    valor_nominal       NUMERIC(14,2),
    monto_invertido     NUMERIC(14,2),
    cupon_trimestral    NUMERIC(14,2),
    cupon_anual         NUMERIC(14,2),
    estado              VARCHAR
)
LANGUAGE sql STABLE AS $$
    SELECT b.id,
           b.serie,
           b.nombre,
           b.numero_serie,
           b.tipo,
           b.sector,
           e.nombre,
           e.ruc,
           b.moneda,
           b.calificacion_riesgo,
           b.tipo_interes,
           b.tasa_anual,
           'Trimestral (cierre de trimestre)'::varchar,
           ROUND((b.fecha_vencimiento - b.fecha_emision) / 365.25)::int,
           b.fecha_emision,
           b.fecha_vencimiento,
           i.fecha_compra,
           i.valor_nominal,
           i.monto_invertido,
           ROUND(i.valor_nominal * b.tasa_anual / 100 / 4, 2),
           ROUND(i.valor_nominal * b.tasa_anual / 100, 2),
           (CASE WHEN b.fecha_vencimiento < CURRENT_DATE THEN 'Vencido' ELSE 'Activo' END)::varchar
    FROM inversiones i
    JOIN bonos b    ON b.id = i.bono_id
    JOIN emisores e ON e.id = b.emisor_id
    WHERE i.cliente_id = p_cliente_id
      AND b.id = p_bono_id
$$;

-- Calendario de pagos de un bono del cliente
CREATE OR REPLACE FUNCTION sp_calendario_pagos(p_cliente_id INT, p_bono_id INT)
RETURNS TABLE (
    numero   INT,
    fecha    DATE,
    concepto VARCHAR,
    monto    NUMERIC(14,2),
    estado   VARCHAR
)
LANGUAGE sql STABLE AS $$
    SELECT f.numero, f.fecha, f.concepto, f.monto, f.estado
    FROM fn_flujos_cliente(p_cliente_id) f
    WHERE f.bono_id = p_bono_id
    ORDER BY f.numero
$$;
