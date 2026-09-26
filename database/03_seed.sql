-- =============================================================
--  Sistema de Bonos - Datos ficticios
--  Contraseña de todos los clientes demo: Demo1234!
-- =============================================================

INSERT INTO emisores (nombre, ruc) VALUES
    ('Instituto Educativo Los Andes S.A.C.',   '20512345671'),
    ('Minera Metales del Sur S.A.',            '20498765432'),
    ('Constructora Vía Norte S.A.C.',          '20601122334'),
    ('Clínica San Gabriel S.A.C.',             '20556677889'),
    ('Energía Solar del Pacífico S.A.',        '20611223344'),
    ('Agroexportadora Valle Verde S.A.C.',     '20477889900');

INSERT INTO bonos (serie, nombre, numero_serie, sector, emisor_id, moneda, calificacion_riesgo, tasa_anual, fecha_emision, fecha_vencimiento) VALUES
    ('A', 'Bono Corporativo Serie A', 'SERIE-EDU-2024-A', 'Educación privada',        1, 'USD', 'A',    8.50, '2024-01-01', '2029-12-31'),
    ('B', 'Bono Corporativo Serie B', 'SERIE-MET-2023-B', 'Metales preciosos',        2, 'USD', 'BBB+', 9.75, '2023-01-01', '2028-12-31'),
    ('C', 'Bono Corporativo Serie C', 'SERIE-INF-2025-C', 'Infraestructura privada',  3, 'USD', 'A-',   7.25, '2025-01-01', '2028-12-31'),
    ('D', 'Bono Corporativo Serie D', 'SERIE-SAL-2024-D', 'Salud privada',            4, 'USD', 'AA-',  6.80, '2024-07-01', '2030-06-30'),
    ('E', 'Bono Corporativo Serie E', 'SERIE-ENE-2025-E', 'Energía renovable',        5, 'USD', 'A+',   7.90, '2025-04-01', '2031-03-31'),
    ('F', 'Bono Corporativo Serie F', 'SERIE-AGR-2021-F', 'Agroindustria',            6, 'USD', 'BBB',  10.25, '2021-01-01', '2025-12-31');

INSERT INTO clientes (nombres, apellidos, documento, correo, password_hash, creado_en) VALUES
    ('Lucía',  'Fernández Rojas', '45871236', 'lucia@demo.com',  '$2b$10$1PyWylFqEiKMbb29xXnNUuBI9IhTYd23/XFNbIkuAJi2EuYTWqEHq', '2022-11-15'),
    ('Carlos', 'Mendoza Silva',   '40125698', 'carlos@demo.com', '$2b$10$1PyWylFqEiKMbb29xXnNUuBI9IhTYd23/XFNbIkuAJi2EuYTWqEHq', '2020-12-02'),
    ('Ana',    'Torres Quispe',   '72014589', 'ana@demo.com',    '$2b$10$1PyWylFqEiKMbb29xXnNUuBI9IhTYd23/XFNbIkuAJi2EuYTWqEHq', '2024-05-20');

-- Lucía: cartera del boceto (A, B, C) + Serie D
INSERT INTO inversiones (cliente_id, bono_id, valor_nominal, monto_invertido, fecha_compra) VALUES
    (1, 1,  50000.00,  50000.00, '2024-01-01'),
    (1, 2,  78500.00,  78500.00, '2023-01-01'),
    (1, 3, 120000.00, 120000.00, '2025-01-01'),
    (1, 4,  60000.00,  59400.00, '2024-07-01');

-- Carlos: B, E y un bono ya vencido (F)
INSERT INTO inversiones (cliente_id, bono_id, valor_nominal, monto_invertido, fecha_compra) VALUES
    (2, 2,  25000.00,  25000.00, '2023-01-01'),
    (2, 5, 100000.00,  99500.00, '2025-04-01'),
    (2, 6,  40000.00,  40000.00, '2021-01-01');

-- Ana: A y D
INSERT INTO inversiones (cliente_id, bono_id, valor_nominal, monto_invertido, fecha_compra) VALUES
    (3, 1,  15000.00,  15000.00, '2024-06-15'),
    (3, 4,  35000.00,  35000.00, '2024-07-01');
