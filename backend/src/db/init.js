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

// Migrate existing databases: add bilingual columns if not present
const bilingualMigrations = [
  "ALTER TABLE courses ADD COLUMN language TEXT DEFAULT 'zh'",
  "ALTER TABLE courses ADD COLUMN name_zh TEXT",
  "ALTER TABLE courses ADD COLUMN name_en TEXT",
  "ALTER TABLE verses ADD COLUMN content_zh TEXT",
  "ALTER TABLE verses ADD COLUMN content_en TEXT",
  "ALTER TABLE verses ADD COLUMN explanation_zh TEXT",
  "ALTER TABLE verses ADD COLUMN explanation_en TEXT",
  "ALTER TABLE study_content ADD COLUMN content_zh TEXT",
  "ALTER TABLE study_content ADD COLUMN content_en TEXT",
  "ALTER TABLE study_content ADD COLUMN reference_text_zh TEXT",
  "ALTER TABLE study_content ADD COLUMN reference_text_en TEXT",
  "ALTER TABLE schedule ADD COLUMN course_name_zh TEXT",
  "ALTER TABLE schedule ADD COLUMN course_name_en TEXT",
];

for (const migration of bilingualMigrations) {
  try {
    db.exec(migration);
  } catch {
    // Column already exists — safe to ignore
  }
}

// Backfill existing data into bilingual columns (only where not yet set)
db.exec("UPDATE courses SET language = 'zh', name_zh = name WHERE name_zh IS NULL");
db.exec("UPDATE verses SET content_zh = content WHERE content_zh IS NULL");
db.exec("UPDATE verses SET explanation_zh = explanation WHERE explanation_zh IS NULL AND explanation IS NOT NULL");
db.exec("UPDATE study_content SET content_zh = content WHERE content_zh IS NULL AND content IS NOT NULL");
db.exec("UPDATE study_content SET reference_text_zh = reference_text WHERE reference_text_zh IS NULL AND reference_text IS NOT NULL");
db.exec("UPDATE schedule SET course_name_zh = course_name WHERE course_name_zh IS NULL");

console.log('Database initialized successfully at:', dbPath);

export default db;
