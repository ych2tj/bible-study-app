-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    course_date TEXT,
    course_time TEXT,
    leader TEXT,
    visible INTEGER DEFAULT 1 CHECK (visible IN (0, 1)),
    language TEXT DEFAULT 'zh',
    name_zh TEXT,
    name_en TEXT,
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
    content_zh TEXT,
    content_en TEXT,
    explanation_zh TEXT,
    explanation_en TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Study content and references table
CREATE TABLE IF NOT EXISTS study_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER UNIQUE NOT NULL,
    content TEXT,
    reference_text TEXT,
    content_zh TEXT,
    content_en TEXT,
    reference_text_zh TEXT,
    reference_text_en TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Schedule table for course timetable
CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_date TEXT NOT NULL,
    course_time TEXT,
    course_name TEXT NOT NULL,
    course_name_zh TEXT,
    course_name_en TEXT,
    leader TEXT,
    visible INTEGER DEFAULT 1 CHECK (visible IN (0, 1)),
    is_manual INTEGER DEFAULT 0 CHECK (is_manual IN (0, 1)),
    course_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_verses_course_id ON verses(course_id);
CREATE INDEX IF NOT EXISTS idx_study_content_course_id ON study_content(course_id);
CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(course_date);
CREATE INDEX IF NOT EXISTS idx_schedule_visible ON schedule(visible);
