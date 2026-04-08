import express from 'express';
import db from '../db/init.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all schedule items (public - for Study Page)
router.get('/', (req, res) => {
  try {
    const schedules = db.prepare('SELECT * FROM schedule WHERE visible = 1 ORDER BY course_date DESC').all();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all schedule items including hidden (admin - for Edit Page)
router.get('/all', checkAuth, (req, res) => {
  try {
    const schedules = db.prepare('SELECT * FROM schedule ORDER BY course_date DESC').all();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single schedule item by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const schedule = db.prepare('SELECT * FROM schedule WHERE id = ?').get(id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule item not found' });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new schedule item
router.post('/', checkAuth, (req, res) => {
  try {
    const { course_date, course_time, course_name, course_name_zh, course_name_en, leader, visible, is_manual, course_id } = req.body;

    if (!course_date || (!course_name && !course_name_zh && !course_name_en)) {
      return res.status(400).json({ error: 'course_date and course_name are required' });
    }

    const resolvedName = course_name || course_name_zh || course_name_en;

    const result = db.prepare(`
      INSERT INTO schedule (course_date, course_time, course_name, course_name_zh, course_name_en, leader, visible, is_manual, course_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      course_date,
      course_time || null,
      resolvedName,
      course_name_zh || null,
      course_name_en || null,
      leader || null,
      visible !== undefined ? visible : 1,
      is_manual !== undefined ? is_manual : 1,
      course_id || null
    );

    const schedule = db.prepare('SELECT * FROM schedule WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ id: result.lastInsertRowid, ...schedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update schedule item
router.put('/:id', checkAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { course_date, course_time, course_name, course_name_zh, course_name_en, leader, visible, is_manual } = req.body;

    // Check if item exists
    const existing = db.prepare('SELECT * FROM schedule WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Schedule item not found' });
    }

    const resolvedName = course_name || course_name_zh || course_name_en || existing.course_name;

    db.prepare(`
      UPDATE schedule
      SET course_date = ?, course_time = ?, course_name = ?, course_name_zh = ?, course_name_en = ?,
          leader = ?, visible = ?, is_manual = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      course_date,
      course_time || null,
      resolvedName,
      course_name_zh !== undefined ? course_name_zh : existing.course_name_zh,
      course_name_en !== undefined ? course_name_en : existing.course_name_en,
      leader || null,
      visible,
      is_manual,
      id
    );

    const updated = db.prepare('SELECT * FROM schedule WHERE id = ?').get(id);
    res.json({ success: true, ...updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle visibility
router.patch('/:id/visibility', checkAuth, (req, res) => {
  try {
    const { id } = req.params;

    // Get current visibility
    const item = db.prepare('SELECT visible FROM schedule WHERE id = ?').get(id);

    if (!item) {
      return res.status(404).json({ error: 'Schedule item not found' });
    }

    const newVisibility = item.visible === 1 ? 0 : 1;

    db.prepare('UPDATE schedule SET visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newVisibility, id);

    res.json({ visible: newVisibility });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete schedule item
router.delete('/:id', checkAuth, (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM schedule WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Schedule item not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-populate from courses (add new + update existing auto-populated entries)
router.post('/auto-populate', checkAuth, (req, res) => {
  try {
    // Get all courses with dates
    const courses = db.prepare('SELECT id, name, name_zh, name_en, course_date, course_time, leader, visible FROM courses WHERE course_date IS NOT NULL').all();

    if (courses.length === 0) {
      return res.json({ added: 0, updated: 0, message: 'No courses with dates found' });
    }

    // Get existing schedule items linked to courses (auto-populated only)
    const existingSchedule = db.prepare('SELECT id, course_id FROM schedule WHERE course_id IS NOT NULL AND is_manual = 0').all();

    const existingMap = new Map(existingSchedule.map(item => [item.course_id, item.id]));

    let added = 0;
    let updated = 0;

    const insertStmt = db.prepare(`
      INSERT INTO schedule (course_date, course_time, course_name, course_name_zh, course_name_en, leader, visible, is_manual, course_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    const updateStmt = db.prepare(`
      UPDATE schedule
      SET course_name = ?, course_name_zh = ?, course_name_en = ?, course_date = ?, course_time = ?, leader = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (const course of courses) {
      const scheduleId = existingMap.get(course.id);

      if (scheduleId) {
        // Update existing auto-populated entry
        updateStmt.run(
          course.name,
          course.name_zh || null,
          course.name_en || null,
          course.course_date,
          course.course_time || null,
          course.leader || null,
          course.visible,
          scheduleId
        );
        updated++;
      } else {
        // Insert new schedule item
        insertStmt.run(
          course.course_date,
          course.course_time || null,
          course.name,
          course.name_zh || null,
          course.name_en || null,
          course.leader || null,
          course.visible,
          course.id
        );
        added++;
      }
    }

    res.json({ added, updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync existing auto-populated schedule items with latest course data
router.post('/sync-from-courses', checkAuth, (req, res) => {
  try {
    // Get all schedule items that are linked to courses (auto-populated)
    const scheduleItems = db.prepare('SELECT id, course_id FROM schedule WHERE course_id IS NOT NULL AND is_manual = 0').all();

    if (scheduleItems.length === 0) {
      return res.json({ updated: 0, message: 'No auto-populated schedule items to sync' });
    }

    // Get the latest course data for these courses
    const courseIds = scheduleItems.map(item => item.course_id);
    const placeholders = courseIds.map(() => '?').join(',');
    const courses = db.prepare(`SELECT id, name, name_zh, name_en, course_date, course_time, leader, visible FROM courses WHERE id IN (${placeholders})`).all(...courseIds);

    // Create a map of course_id -> course data
    const courseMap = new Map(courses.map(course => [course.id, course]));

    // Update schedule items with latest course data
    const updateStmt = db.prepare(`
      UPDATE schedule
      SET course_name = ?, course_name_zh = ?, course_name_en = ?, course_date = ?, course_time = ?, leader = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    let updated = 0;

    for (const item of scheduleItems) {
      const course = courseMap.get(item.course_id);
      if (!course) continue; // Course was deleted

      updateStmt.run(
        course.name,
        course.name_zh || null,
        course.name_en || null,
        course.course_date,
        course.course_time || null,
        course.leader || null,
        course.visible,
        item.id
      );
      updated++;
    }

    res.json({ updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
