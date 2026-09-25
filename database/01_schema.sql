-- =============================================================
--  Sistema de Bonos - Esquema
--  Motor: PostgreSQL (Supabase)
-- =============================================================

DROP TABLE IF EXISTS inversiones CASCADE;
DROP TABLE IF EXISTS bonos CASCADE;
DROP TABLE IF EXISTS emisores CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

CREATE TABLE clientes (
    id              SERIAL PRIMARY KEY,
    nombres         VARCHAR(80)  NOT NULL,
    apellidos       VARCHAR(80)  NOT NULL,
    documento       VARCHAR(20)  NOT NULL UNIQUE,
    correo          VARCHAR(120) NOT NULL UNIQUE,
    password_hash   VARCHAR(100) NOT NULL,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE emisores (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(120) NOT NULL UNIQUE,
    ruc     VARCHAR(20)  NOT NULL UNIQUE
);

CREATE TABLE bonos (
    id                  SERIAL PRIMARY KEY,
    serie               CHAR(1)       NOT NULL UNIQUE,          -- A, B, C...
    nombre              VARCHAR(80)   NOT NULL,                 -- Bono Corporativo Serie A
    numero_serie        VARCHAR(30)   NOT NULL UNIQUE,          -- SERIE-EDU-2024-A
    tipo                VARCHAR(60)   NOT NULL DEFAULT 'Bono corporativo privado',
    sector              VARCHAR(60)   NOT NULL,
    emisor_id           INT           NOT NULL REFERENCES emisores(id),
    moneda              CHAR(3)       NOT NULL CHECK (moneda IN ('USD', 'PEN')),
    calificacion_riesgo VARCHAR(5)    NOT NULL,
    tipo_interes        VARCHAR(10)   NOT NULL DEFAULT 'Fijo',
    tasa_anual          NUMERIC(5,2)  NOT NULL CHECK (tasa_anual > 0),
    fecha_emision       DATE          NOT NULL,
    fecha_vencimiento   DATE          NOT NULL,
    CHECK (fecha_vencimiento > fecha_emision)
);

-- Posición de cada cliente en cada bono (valor nominal adquirido)
CREATE TABLE inversiones (
    id              SERIAL PRIMARY KEY,
    cliente_id      INT            NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    bono_id         INT            NOT NULL REFERENCES bonos(id),
    valor_nominal   NUMERIC(14,2)  NOT NULL CHECK (valor_nominal > 0),
    monto_invertido NUMERIC(14,2)  NOT NULL CHECK (monto_invertido > 0),
    fecha_compra    DATE           NOT NULL,
    UNIQUE (cliente_id, bono_id)
);

CREATE INDEX ix_inversiones_cliente ON inversiones(cliente_id);
