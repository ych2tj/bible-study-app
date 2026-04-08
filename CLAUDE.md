# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bible Study Group Teaching Document Management — A full-stack web application for managing and displaying Bible study course materials with bilingual support (Chinese/English). Designed for local deployment with 10-20 users.

## Architecture

### Monorepo Structure
**Dual-server architecture** — both must run simultaneously:
- **Backend**: Express REST API (port 3001) with SQLite database (`backend/`)
- **Frontend**: React + Vite SPA (port 5173+) (`frontend/`)

### Key Design Decisions

1. **Bilingual Content System**: Every course has a `language` field (`zh`/`en`) indicating the source language. All user-facing text fields have paired `_zh`/`_en` columns. The `getLocalizedText(zh, en, currentLang)` helper (defined locally in each component) picks the right value at render time.

2. **Write-Through to Bilingual Columns**: When creating or updating a verse, study content, or course name, the backend routes also write to the appropriate `_zh`/`_en` column based on the course's `language` field. This means the `TranslationPage` sees content immediately after saving without requiring manual translation first.
   - `verses.js` POST/PUT: also writes `content_zh`/`content_en`, `explanation_zh`/`explanation_en`
   - `studyContent.js` POST: also writes `content_zh`/`content_en`, `reference_text_zh`/`reference_text_en`
   - `courses.js` POST/PUT: also writes `name_zh` or `name_en`

3. **Translation Page** (`/translation/:courseId`): Shows a side-by-side table of original vs. translated text. Proxies translation through the backend to hide the API key. `buildItems()` reads **only** `_zh`/`_en` columns — shows "no content" if null, does **not** fall back to base columns. Saves translations via `POST /api/translate/save`.

4. **Dual View Modes** (Study Page):
   - **PC Mode**: Click verse to see explanation in a separate card below; card height is resizable by dragging
   - **Mobile Mode**: Click verse to expand inline accordion-style explanation
   - Preference saved to `localStorage`

5. **Course Visibility**: `visible` field (1=visible, 0=hidden). Study Page only shows visible courses; Edit Page shows all.

6. **Schedule Auto-Population**: Schedule items link to courses via `course_id`. Edits to a linked schedule item sync back to the course. `is_manual` field: 0=auto, 1=manual.

7. **Database Field Naming**: `study_content` uses `reference_text` (not `references` — SQL reserved word).

8. **TypeScript Import Pattern**: Always use `import type { ... } from '../types'`. Regular type imports cause Vite module resolution errors.

9. **Auth Token Persistence**: Auth token is stored in `sessionStorage` so it survives page navigation (e.g. returning from `/translation/:courseId` to `/edit`). `EditPage` initializes `isAuthenticated` from `getAuthToken()` to avoid re-prompting login on navigation.

## Development Commands

### Running the Application
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```
Or use the convenience script:
```bash
./start.sh   # loads .env and starts both servers
```
`start.sh` is git-ignored (it displays the password).

### Database Operations
```bash
# Reset database (deletes all data)
cd backend && rm database.sqlite && npm run dev
```
Database location: `backend/database.sqlite` (auto-created on first run).  
On startup, `backend/src/db/init.js` runs schema creation **and** bilingual migration `ALTER TABLE ADD COLUMN` statements (each wrapped in try/catch to handle already-existing columns), then backfills existing data into `_zh` columns.

### Build for Production
```bash
cd frontend && npm run build   # output to frontend/dist/
```

## Backend API Structure

**Entry**: `backend/src/server.js` — mounts all routers, configures CORS.

**Routes**:
| File | Prefix | Notes |
|---|---|---|
| `routes/auth.js` | `/api/auth` | Login, change-password |
| `routes/courses.js` | `/api/courses` | GET `/` visible only; GET `/all` auth required |
| `routes/verses.js` | `/api/verses` | CRUD + bulk |
| `routes/studyContent.js` | `/api/study-content` | 1:1 with course |
| `routes/schedule.js` | `/api/schedule` | 8 endpoints incl. auto-populate, sync |
| `routes/translate.js` | `/api/translate` | `GET /health`, `POST /` (proxy), `POST /save` |

**Translation proxy** (`routes/translate.js`): reads `BIBLE_TRANSLATION_API_URL` and `BIBLE_TRANSLATION_API_KEY` from env, calls `${url}/api/v1/translate` with `X-API-Key` header. Health check hits `${url}/health/ready`. `POST /save` writes translated text into the appropriate `_zh`/`_en` column based on `type` and `targetLang`.

**Authentication**:
- Bearer token = the actual password
- `middleware/auth.js` uses getter functions (not cached at startup) so password changes take effect immediately
- Public: GET courses, verses, study-content, schedule
- Protected: all mutations + translate endpoints

**Database pattern**:
```javascript
import db from '../db/init.js';  // singleton
db.prepare('SELECT ...').all();  // multiple rows
db.prepare('SELECT ...').get();  // single row
db.prepare('INSERT ...').run();  // mutation
```

## Frontend Component Architecture

**Routing** (`App.tsx`):
```
Router
└── Layout (nav + language switcher)
    ├── "/"                      → StudyPage (courses tab + schedule tab)
    ├── "/edit"                  → EditPage → CourseEditor (3 tabs) + password change
    └── "/translation/:courseId" → TranslationPage
```

**Navigation flow for translation**:
- `StudyContentEditor` has a purple "Translation" button → `navigate('/translation/:courseId')`
- `TranslationPage` "Back to Edit Page" → `navigate('/edit', { state: { returnCourseId, tab: 'verse' } })`
- `CourseEditor` `useEffect` on `location.state` → auto-selects course and switches to Verse tab

**Key component responsibilities**:
- `TranslationPage`: builds `TranslationItem[]` from course data (only `_zh`/`_en` columns), shows side-by-side original/translated table, per-row translate button plus batch translate, rate-limits API calls at ~6s between items (10 req/min), saves via `translateAPI.saveTranslation()`
- `CourseEditor`: language selector on course creation; ZH/EN badge on course list; language note info banner; auto-return from TranslationPage
- `VerseEditor`: amber language warning banners in add/edit forms; localized content/explanation display; accepts `courseLanguage` prop
- `StudyContentEditor`: amber language warning banners; language-aware save (saves to `_en` columns when viewing English translation); "Translation" button
- `StudyPage` / `ScheduleView` / `ScheduleManager`: all use `getLocalizedText()` for display
- `ScheduleManager`: ZH/EN tab toggle for entering bilingual course names

**API Client** (`services/api.ts`):
- `authToken` initialized from `sessionStorage.getItem('authToken')` on module load
- `setAuthToken()` / `clearAuthToken()` also read/write sessionStorage
- `getAuthToken()` — exported, used by `EditPage` to initialize auth state
- `translateAPI` — `checkHealth()`, `translate(paragraph)`, `saveTranslation(courseId, type, translatedText, targetLang, itemId?)`
- `scheduleAPI.create/update` accept `course_name_zh` and `course_name_en`

**i18n** (`i18n/zh.json`, `i18n/en.json`):
- Default language: Chinese
- Key namespaces: `nav`, `auth`, `course`, `translation`, `verse`, `study`, `schedule`, `common`
- `translation.*` namespace for the translation feature (26 keys)
- `course.language`, `course.languageChinese`, `course.languageEnglish`, `course.languageNote`, `course.editLanguageNote`
- `verse.verseHeading` — used in PC mode explanation heading

## Data Model

```
courses (1) ──< verses (many)
   │
   ├──── study_content (1:1)
   │
   └──── schedule (0..1, ON DELETE SET NULL)
```

**Bilingual columns**:
- `courses`: `language TEXT DEFAULT 'zh'`, `name_zh`, `name_en`
- `verses`: `content_zh`, `content_en`, `explanation_zh`, `explanation_en`
- `study_content`: `content_zh`, `content_en`, `reference_text_zh`, `reference_text_en`
- `schedule`: `course_name_zh`, `course_name_en`

Existing data is backfilled: `name` → `name_zh`, `content` → `content_zh`, etc. on first startup after migration.

## Configuration

**Required `.env`** (project root, git-ignored — create manually):
```
AUTH_USERNAME=your_username
AUTH_PASSWORD=your_password
```

**Optional `.env`** (for translation feature):
```
BIBLE_TRANSLATION_API_URL=https://your-translation-service.com
BIBLE_TRANSLATION_API_KEY=your-key
```

**Tailwind CSS v4**:
- `frontend/src/index.css` must use `@import "tailwindcss";` — never change to `@tailwind` directives
- `frontend/postcss.config.js` uses `@tailwindcss/postcss`
- Custom theme in `frontend/tailwind.config.js`: palettes (`sacred`, `divine`, `grace`, `heaven`), fonts, gradients, shadows

## Reusable Dialog Components

Always use these instead of `alert()`/`confirm()`:
- `ConfirmDialog` — destructive action confirmation; props: `isOpen`, `title`, `message`, `onConfirm`, `onCancel`, `variant`
- `AlertDialog` — success/error/info feedback; props: `isOpen`, `title`, `message`, `onClose`, `variant`

## Known Issues & Workarounds

**Blank page on frontend load**: Vite module caching. Fix: `rm -rf frontend/node_modules/.vite`, ensure `import type` syntax, hard refresh.

**Port already in use**:
```bash
pkill -f "node --watch" && pkill -f "vite"
```

**CORS errors**: Check `API_BASE_URL = 'http://localhost:3001/api'` in `services/api.ts` and CORS origin in `server.js` matches `http://localhost:5173`.

## First-Time Setup

```bash
# Create .env manually at project root with AUTH_USERNAME and AUTH_PASSWORD
cd backend && npm install
cd ../frontend && npm install
# database auto-creates on first backend startup
```
