import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config();

const db = new Database(process.env.DATABASE_PATH || './data/cleantech.db');
const seedPath = path.join(process.cwd(), 'src/models/seed.sql');
const seedSQL = fs.readFileSync(seedPath, 'utf8');
db.exec(seedSQL);
console.log('Seeding complete.');
db.close();
