import app from './app.js';
import { getDb } from './db.js';

const PORT = Number(process.env.PORT) || 4000;

await getDb();
app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}`));
