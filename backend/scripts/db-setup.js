// Crea tablas, stored procedures y datos ficticios en la base de DATABASE_URL.
// ¡Borra y recrea las tablas del sistema!
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { SQL_DIR, SQL_FILES } from '../src/db.js';

if (!process.env.DATABASE_URL) {
  console.error('Define DATABASE_URL en backend/.env (ver .env.example).');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

await client.connect();
try {
  for (const file of SQL_FILES) {
    process.stdout.write(`→ ${file} ... `);
    await client.query(fs.readFileSync(path.join(SQL_DIR, file), 'utf8'));
    console.log('ok');
  }
  console.log('Base de datos lista.');
} finally {
  await client.end();
}
