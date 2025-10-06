import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const dbPath = join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Read and execute schema
const schemaPath = join(__dirname, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

// Execute schema statements
const statements = schema.split(';').filter(stmt => stmt.trim());
statements.forEach(statement => {
  if (statement.trim()) {
    db.exec(statement);
  }
});

console.log('Database initialized successfully at:', dbPath);

export default db;
