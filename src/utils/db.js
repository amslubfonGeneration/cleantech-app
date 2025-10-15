import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || './data/cleantech.db';
const db = new Database(dbPath);

const hasUsers = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
if (!hasUsers) {
  const schemaSQL = fs.readFileSync(path.join(process.cwd(), 'src/models/schema.sql'), 'utf8');
  db.exec(schemaSQL);
}

export default db;
