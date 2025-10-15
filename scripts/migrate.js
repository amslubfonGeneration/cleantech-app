import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config();

const db = new Database(process.env.DATABASE_PATH || './data/cleantech.db');
const schemaPath = path.join(process.cwd(), 'src/models/schema.sql');
const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSQL);
console.log('Migration complete.');
db.close();
