import express from 'express';
import db from '../db/init.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Get study content for a course
router.get('/:courseId', (req, res) => {
  try {
    const { courseId } = req.params;
    const studyContent = db.prepare('SELECT * FROM study_content WHERE course_id = ?').get(courseId);

    if (!studyContent) {
      return res.json({ content: '', reference_text: '' });
    }

    res.json(studyContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add or update study content for a course
router.post('/', checkAuth, (req, res) => {
  try {
    const { course_id, content, references } = req.body;

    if (!course_id) {
      return res.status(400).json({ error: 'course_id is required' });
    }

    const course = db.prepare('SELECT language FROM courses WHERE id = ?').get(course_id);
    const courseLang = course?.language || 'zh';

    // Check if study content already exists
    const existing = db.prepare('SELECT * FROM study_content WHERE course_id = ?').get(course_id);

    let result;
    if (existing) {
      // Update existing
      db.prepare(`
        UPDATE study_content
        SET content = ?, reference_text = ?,
            content_zh = CASE WHEN ? = 'zh' THEN ? ELSE content_zh END,
            content_en = CASE WHEN ? = 'en' THEN ? ELSE content_en END,
            reference_text_zh = CASE WHEN ? = 'zh' THEN ? ELSE reference_text_zh END,
            reference_text_en = CASE WHEN ? = 'en' THEN ? ELSE reference_text_en END
        WHERE course_id = ?
      `).run(
        content || '', references || '',
        courseLang, content || '',
        courseLang, content || '',
        courseLang, references || '',
        courseLang, references || '',
        course_id
      );
      result = db.prepare('SELECT * FROM study_content WHERE course_id = ?').get(course_id);
    } else {
      // Insert new
      const insertResult = db.prepare(`
        INSERT INTO study_content (course_id, content, reference_text, content_zh, content_en, reference_text_zh, reference_text_en)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        course_id, content || '', references || '',
        courseLang === 'zh' ? (content || '') : null,
        courseLang === 'en' ? (content || '') : null,
        courseLang === 'zh' ? (references || '') : null,
        courseLang === 'en' ? (references || '') : null
      );
      result = db.prepare('SELECT * FROM study_content WHERE id = ?').get(insertResult.lastInsertRowid);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete study content
router.delete('/:courseId', checkAuth, (req, res) => {
  try {
    const { courseId } = req.params;
    const result = db.prepare('DELETE FROM study_content WHERE course_id = ?').run(courseId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Study content not found' });
    }

    res.json({ success: true, message: 'Study content deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
