import express from 'express';
import db from '../db/init.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Add verse to course
router.post('/', checkAuth, (req, res) => {
  try {
    const { course_id, gospel, chapter, verse_number, content, explanation, order_index } = req.body;

    if (!course_id || !gospel || !chapter || !verse_number || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.prepare(`
      INSERT INTO verses (course_id, gospel, chapter, verse_number, content, explanation, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(course_id, gospel, chapter, verse_number, content, explanation || '', order_index || 0);

    const verse = db.prepare('SELECT * FROM verses WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(verse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update verse
router.put('/:id', checkAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { gospel, chapter, verse_number, content, explanation, order_index } = req.body;

    if (!gospel || !chapter || !verse_number || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    db.prepare(`
      UPDATE verses
      SET gospel = ?, chapter = ?, verse_number = ?, content = ?, explanation = ?, order_index = ?
      WHERE id = ?
    `).run(gospel, chapter, verse_number, content, explanation || '', order_index || 0, id);

    const verse = db.prepare('SELECT * FROM verses WHERE id = ?').get(id);

    if (!verse) {
      return res.status(404).json({ error: 'Verse not found' });
    }

    res.json(verse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete verse
router.delete('/:id', checkAuth, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM verses WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Verse not found' });
    }

    res.json({ success: true, message: 'Verse deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk add verses for a course
router.post('/bulk', checkAuth, (req, res) => {
  try {
    const { course_id, verses } = req.body;

    if (!course_id || !Array.isArray(verses)) {
      return res.status(400).json({ error: 'course_id and verses array are required' });
    }

    const insert = db.prepare(`
      INSERT INTO verses (course_id, gospel, chapter, verse_number, content, explanation, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((versesToInsert) => {
      for (const verse of versesToInsert) {
        insert.run(
          course_id,
          verse.gospel,
          verse.chapter,
          verse.verse_number,
          verse.content,
          verse.explanation || '',
          verse.order_index || 0
        );
      }
    });

    insertMany(verses);

    const allVerses = db.prepare('SELECT * FROM verses WHERE course_id = ? ORDER BY order_index').all(course_id);

    res.status(201).json(allVerses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
