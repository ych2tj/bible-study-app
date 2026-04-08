import express from 'express';
import db from '../db/init.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all visible courses (public - for Study Page)
router.get('/', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses WHERE visible = 1 ORDER BY created_at DESC').all();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all courses including hidden (admin - for Edit Page)
router.get('/all', checkAuth, (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single course with all content
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const verses = db.prepare('SELECT * FROM verses WHERE course_id = ? ORDER BY order_index').all(id);
    const studyContent = db.prepare('SELECT * FROM study_content WHERE course_id = ?').get(id);

    res.json({
      ...course,
      verses: verses || [],
      studyContent: studyContent || { content: '', reference_text: '' }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new course
router.post('/', checkAuth, (req, res) => {
  try {
    const { name, course_date, course_time, leader, visible, language } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Course name is required' });
    }

    const lang = language || 'zh';
    const result = db.prepare(`
      INSERT INTO courses (name, course_date, course_time, leader, visible, language, name_zh, name_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      course_date || null,
      course_time || null,
      leader || null,
      visible !== undefined ? visible : 1,
      lang,
      lang === 'zh' ? name : null,
      lang === 'en' ? name : null
    );

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course
router.put('/:id', checkAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { name, course_date, course_time, leader, visible, language } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Course name is required' });
    }

    const existing = db.prepare('SELECT language FROM courses WHERE id = ?').get(id);
    const lang = language || existing?.language || 'zh';

    db.prepare(`
      UPDATE courses
      SET name = ?, course_date = ?, course_time = ?, leader = ?, visible = ?, language = ?,
          name_zh = CASE WHEN ? = 'zh' THEN ? ELSE name_zh END,
          name_en = CASE WHEN ? = 'en' THEN ? ELSE name_en END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      course_date || null,
      course_time || null,
      leader || null,
      visible !== undefined ? visible : 1,
      lang,
      lang, name,
      lang, name,
      id
    );

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete course
router.delete('/:id', checkAuth, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM courses WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
