import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SQL_DIR = path.resolve(__dirname, '../../database');
export const SQL_FILES = ['01_schema.sql', '02_procedures.sql', '03_seed.sql'];

// DATE como 'YYYY-MM-DD' (sin corrimientos de zona horaria) y NUMERIC como número
const DATE_OID = 1082;
const NUMERIC_OID = 1700;
pg.types.setTypeParser(DATE_OID, (v) => v);
pg.types.setTypeParser(NUMERIC_OID, (v) => (v === null ? null : Number(v)));

let client;

async function createClient() {
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
      // Cada función serverless abre su propio pool: una conexión por instancia
      max: process.env.VERCEL ? 1 : 5,
    });
    return { query: (text, params) => pool.query(text, params), kind: 'postgres' };
  }

  if (process.env.VERCEL) {
    throw new Error('DATABASE_URL no está configurada en las variables de entorno de Vercel.');
  }

  // Sin DATABASE_URL: base en memoria (PGlite) con el mismo esquema, SPs y datos
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite({
    parsers: { [DATE_OID]: (v) => v, [NUMERIC_OID]: (v) => (v === null ? null : Number(v)) },
  });
  for (const file of SQL_FILES) {
    await db.exec(fs.readFileSync(path.join(SQL_DIR, file), 'utf8'));
  }
  console.warn('⚠  DATABASE_URL no definida: usando base de datos en memoria (PGlite).');
  return { query: (text, params) => db.query(text, params), kind: 'pglite' };
}

export async function getDb() {
  client ??= await createClient();
  return client;
}

/**
 * Ejecuta un stored procedure y devuelve sus filas.
 * `name` siempre es una constante del código (nunca viene del usuario).
 */
export async function callSp(name, params = []) {
  if (!/^sp_[a-z_]+$/.test(name)) throw new Error(`SP inválido: ${name}`);
  const db = await getDb();
  const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await db.query(`SELECT * FROM ${name}(${placeholders})`, params);
  return rows;
}
