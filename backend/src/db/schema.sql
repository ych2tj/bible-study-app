-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bible verses table
CREATE TABLE IF NOT EXISTS verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    gospel TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    explanation TEXT,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Study content and references table
CREATE TABLE IF NOT EXISTS study_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER UNIQUE NOT NULL,
    content TEXT,
    reference_text TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_verses_course_id ON verses(course_id);
CREATE INDEX IF NOT EXISTS idx_study_content_course_id ON study_content(course_id);
