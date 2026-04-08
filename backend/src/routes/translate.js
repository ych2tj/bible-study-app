import express from 'express';
import db from '../db/init.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

const getApiUrl = () => process.env.BIBLE_TRANSLATION_API_URL;
const getApiKey = () => process.env.BIBLE_TRANSLATION_API_KEY;

// GET /health - Check if translation API is reachable
router.get('/health', checkAuth, async (req, res) => {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return res.json({ healthy: false, error: 'BIBLE_TRANSLATION_API_URL not configured' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${apiUrl}/health/ready`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return res.json({ healthy: true });
    }
    return res.json({ healthy: false, error: 'api_error' });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.json({ healthy: false, error: 'timeout' });
    }
    return res.json({ healthy: false, error: 'connection_refused' });
  }
});

// POST / - Proxy a translation request to the translation API
router.post('/', checkAuth, async (req, res) => {
  const { paragraph } = req.body;
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();

  if (!paragraph) {
    return res.status(400).json({ error: 'paragraph is required' });
  }

  if (!apiUrl) {
    return res.status(503).json({ error: 'BIBLE_TRANSLATION_API_URL not configured' });
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify({ paragraph }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Translation API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'translation_api_error', details: errorText });
    }

    const result = await response.json();
    return res.json(result);
  } catch (err) {
    console.error('Translation proxy error:', err);
    return res.status(503).json({ error: 'connection_refused' });
  }
});

// POST /save - Save a single translation result to the DB
router.post('/save', checkAuth, (req, res) => {
  const { courseId, type, itemId, translatedText, targetLang } = req.body;

  if (!courseId || !type || translatedText === undefined || translatedText === null || !targetLang) {
    return res.status(400).json({ error: 'courseId, type, translatedText, and targetLang are required' });
  }

  if (targetLang !== 'zh' && targetLang !== 'en') {
    return res.status(400).json({ error: 'targetLang must be "zh" or "en"' });
  }

  try {
    switch (type) {
      case 'course_name': {
        const col = targetLang === 'zh' ? 'name_zh' : 'name_en';
        db.prepare(`UPDATE courses SET ${col} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(translatedText, courseId);
        break;
      }
      case 'verse_content': {
        if (!itemId) return res.status(400).json({ error: 'itemId required for verse_content' });
        const col = targetLang === 'zh' ? 'content_zh' : 'content_en';
        db.prepare(`UPDATE verses SET ${col} = ? WHERE id = ?`).run(translatedText, itemId);
        break;
      }
      case 'verse_explanation': {
        if (!itemId) return res.status(400).json({ error: 'itemId required for verse_explanation' });
        const col = targetLang === 'zh' ? 'explanation_zh' : 'explanation_en';
        db.prepare(`UPDATE verses SET ${col} = ? WHERE id = ?`).run(translatedText, itemId);
        break;
      }
      case 'study_content': {
        const col = targetLang === 'zh' ? 'content_zh' : 'content_en';
        db.prepare(`UPDATE study_content SET ${col} = ? WHERE course_id = ?`).run(translatedText, courseId);
        break;
      }
      case 'reference_text': {
        const col = targetLang === 'zh' ? 'reference_text_zh' : 'reference_text_en';
        db.prepare(`UPDATE study_content SET ${col} = ? WHERE course_id = ?`).run(translatedText, courseId);
        break;
      }
      default:
        return res.status(400).json({ error: `Unknown type: ${type}` });
    }

    return res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
