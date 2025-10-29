# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bible Study Group Teaching Document Management - A full-stack web application for managing and displaying Bible study course materials with bilingual support (Chinese/English). Designed for local deployment with 10-20 users.

## Architecture

### Monorepo Structure
This is a **dual-server architecture** requiring both frontend and backend to run simultaneously:
- **Backend**: Express REST API (port 3001) with SQLite database
- **Frontend**: React + Vite SPA (port 5173+) consuming the backend API

### Key Design Decisions

1. **Three-Tab Study Page**:
   - **Courses Tab**: Browse and select courses with metadata (date, time, leader)
   - **Schedule Tab**: View upcoming course schedule (auto-filters past dates)
   - Both tabs accessible from Study Page when no course is selected

2. **Dual View Modes** (Study Page):
   - **PC Mode**: Verse explanations in separate card below verses, resizable verses card (drag bottom edge)
   - **Mobile Mode**: Inline accordion-style explanations (click verse to expand/collapse)
   - View preference saved to localStorage

3. **Course Visibility System**:
   - Each course has a `visible` field (1=visible, 0=hidden)
   - Study Page only shows visible courses
   - Edit Page shows all courses (with visibility toggle button)

4. **Schedule Auto-Population**:
   - Schedule items can be manually created OR auto-populated from courses
   - Auto-populated items sync bi-directionally with linked courses
   - `is_manual` field distinguishes entry types (0=auto, 1=manual)

5. **Database Field Naming**: The `study_content` table uses `reference_text` (NOT `references`) because "references" is a SQL reserved keyword

6. **TypeScript Import Pattern**: Always use `import type { ... } from '../types'` syntax when importing TypeScript types. Regular imports cause Vite module resolution errors.

## Development Commands

### Running the Application (Development)
Both servers must run concurrently. Use two terminals:

```bash
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Or use the convenience script (requires `.env` file):
```bash
./start.sh  # Loads .env and starts both servers
```

**IMPORTANT**: The `start.sh` script is git-ignored because it displays the password. The `.env` file must exist with `AUTH_PASSWORD=your_password` for the backend to authenticate properly.

### Database Operations

**Reset database** (deletes all data):
```bash
cd backend
rm database.sqlite
npm run dev  # Auto-recreates schema on startup
```

**Database location**: `backend/database.sqlite` (auto-created on first run)

### Build for Production

```bash
cd frontend
npm run build  # Output to frontend/dist/
```

## Code Architecture

### Backend API Structure

**Server Entry**: `backend/src/server.js`
- Imports all route modules
- Configures CORS (restricted to `http://localhost:5173` in development, production origins need configuration)
- Database initialization runs on import of any route

**Route Organization**:
- `routes/auth.js` - Password verification (POST /api/auth/login) and password change (POST /api/auth/change-password)
- `routes/courses.js` - Full CRUD for courses with new fields (course_date, course_time, leader, visible)
  - GET `/api/courses` - Returns only visible courses (for Study Page)
  - GET `/api/courses/all` - Returns all courses including hidden (for Edit Page, auth required)
- `routes/verses.js` - Verse CRUD + bulk operations + inline editing
- `routes/studyContent.js` - Study content per course (one-to-one relationship)
- `routes/schedule.js` - Schedule management with 8 endpoints:
  - GET `/api/schedule` - Visible schedules only (public)
  - GET `/api/schedule/all` - All schedules including hidden (auth required)
  - POST `/api/schedule` - Create schedule item
  - PUT `/api/schedule/:id` - Update schedule item
  - DELETE `/api/schedule/:id` - Delete schedule item
  - PATCH `/api/schedule/:id/visibility` - Toggle visibility
  - POST `/api/schedule/auto-populate` - Auto-populate from courses with dates
  - POST `/api/schedule/sync-from-courses` - Sync auto-populated items with course changes

**Authentication Pattern**:
- Simple username/password authentication with Bearer token
- Login requires both `AUTH_USERNAME` and `AUTH_PASSWORD` from `.env`
- Token = the actual password (used as Bearer token after login)
- `middleware/auth.js` uses getter functions (`getAuthUsername()` and `getAuthPassword()`) to read from `process.env` dynamically (NOT cached at startup)
- This allows password changes to take effect immediately without server restart
- Public endpoints: GET courses, verses, study content
- Protected endpoints: All POST/PUT/DELETE operations

**Password Change Mechanism**:
- POST `/api/auth/change-password` endpoint writes new password to `.env` file
- Updates `process.env.AUTH_PASSWORD` for current process
- Auth middleware uses getter function, so new password works immediately
- Frontend updates auth token automatically after password change

**Database Pattern**:
```javascript
import db from '../db/init.js';  // Singleton database connection
db.prepare('SELECT ...').all();   // Multiple rows
db.prepare('SELECT ...').get();   // Single row
db.prepare('INSERT ...').run();   // Mutation
```

### Frontend Component Architecture

**Routing Structure** (`App.tsx`):
```
Router
└── Layout (navigation + language switcher)
    ├── Route "/" → StudyPage
    │                ├── Courses Tab → Course list with metadata
    │                └── Schedule Tab → ScheduleView
    └── Route "/edit" → EditPage
                        ├── CourseEditor (3 tabs)
                        │   ├── Course Tab → Course CRUD with inline editing
                        │   ├── Verse Tab → VerseEditor (inline edit + auto-sort)
                        │   ├── Schedule Tab → ScheduleManager
                        │   └── StudyContentEditor
                        └── Password Change Section (below course content)
```

**Edit Page Password Change UI**:
- Located at bottom of EditPage (after CourseEditor)
- Opens modal dialog for password change
- Validates password confirmation
- Shows success/error messages
- New password takes effect immediately

**State Management Pattern**:
- No global state library (Redux, Context, etc.)
- Each page component fetches its own data via `services/api.ts`
- Parent components pass refresh callbacks to children for data invalidation
- Course list components (`StudyPage`, `CourseEditor`) load verse counts dynamically for each course using parallel API calls
- View mode preference (PC/Mobile) persisted to localStorage

**Key Component Features**:
- **StudyPage**: Tab navigation, view mode toggle, resizable card (PC mode), inline expansion (mobile mode)
- **ScheduleView**: Auto-filters past dates, displays upcoming schedules with icons
- **ScheduleManager**: Full CRUD, auto-populate button, visibility toggles, inline editing
- **CourseEditor**: 3-tab interface (Course/Verse/Schedule), inline course editing, visibility toggles
- **VerseEditor**: Inline editing forms, automatic verse sorting by chapter/verse number

**API Client** (`services/api.ts`):
- Centralized HTTP client using native `fetch`
- Auth token stored in module-level variable (`authToken`)
- Call `setAuthToken(password)` after successful login
- All functions are async and throw on HTTP errors

**i18n Architecture**:
- Config: `i18n/config.ts` (initializes i18next with Chinese as default)
- Translation files: `i18n/zh.json`, `i18n/en.json`
- Usage: `const { t } = useTranslation()` hook, then `t('nav.study')`
- Language switching: `i18n.changeLanguage('en' | 'zh')`

### Database-Frontend Field Mapping

The database uses `reference_text` field, and the frontend now correctly uses this field name throughout:

```typescript
// Frontend types (types/index.ts)
export type StudyContent = {
  reference_text: string;  // Matches actual DB column
}

// Backend API (routes/studyContent.js)
const { references } = req.body;  // Frontend sends "references"
// Mapped to: reference_text in SQL queries
```

## Common Development Patterns

### Adding a New API Endpoint

1. Add route handler in appropriate file (`backend/src/routes/*.js`)
2. Add to route exports
3. Import/mount in `server.js` if new router
4. Add TypeScript type in `frontend/src/types/index.ts` (use `export type`)
5. Add API client function in `frontend/src/services/api.ts` (use `import type`)
6. Use in component via `import { apiName } from '../services/api'`

### Adding a New UI Translation

1. Add key-value to `frontend/src/i18n/zh.json`
2. Add same key-value to `frontend/src/i18n/en.json`
3. Use in component: `{t('your.new.key')}`

### Component File Naming and Location
All React components use `.tsx` extension (TypeScript + JSX)

**Component Organization**:
- **Page Components** (in `frontend/src/components/`):
  - `StudyPage.tsx` - Main public page with courses and schedule tabs
  - `EditPage.tsx` - Admin page with authentication
- **Editor Components** (in `frontend/src/components/`):
  - `CourseEditor.tsx` - Tabbed editor for courses, verses, and schedule
  - `VerseEditor.tsx` - Verse management with inline editing
  - `StudyContentEditor.tsx` - Study notes and references editor
  - `ScheduleManager.tsx` - Schedule CRUD with auto-populate
- **View Components** (in `frontend/src/components/`):
  - `ScheduleView.tsx` - Public schedule display
- **Utility Components** (in `frontend/src/components/`):
  - `ConfirmDialog.tsx` - Reusable confirmation dialogs
  - `AlertDialog.tsx` - Reusable alert/notification dialogs
  - `Layout.tsx` - App shell with navigation
  - `LanguageSwitcher.tsx` - i18n language toggle

Note: Despite their role as "pages", `StudyPage.tsx` and `EditPage.tsx` are located in the `components/` folder, not a separate `pages/` folder.

### Reusable Dialog Components

The application uses custom dialog components instead of browser `alert()` and `confirm()`:

**ConfirmDialog** (`components/ConfirmDialog.tsx`):
- Used for destructive actions (delete confirmations)
- Props: `isOpen`, `title`, `message`, `onConfirm`, `onCancel`, `variant` ('danger' | 'warning' | 'info')
- Supports i18n translations

**AlertDialog** (`components/AlertDialog.tsx`):
- Used for success/error/info messages
- Props: `isOpen`, `title`, `message`, `onClose`, `variant` ('success' | 'error' | 'info')
- Auto-dismissible with close button

Usage pattern:
```typescript
const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
const [alert, setAlert] = useState<{title: string; message: string; variant: 'success' | 'error' | 'info'} | null>(null);

// Trigger confirmation
<button onClick={() => setConfirmDelete(itemId)}>Delete</button>

// Show alert
setAlert({ title: t('common.success'), message: 'Saved!', variant: 'success' });
```

## Known Issues & Workarounds

### Issue: Blank page on frontend load
**Cause**: Vite module caching issues with TypeScript type imports
**Solution**:
1. Clear Vite cache: `rm -rf frontend/node_modules/.vite`
2. Ensure all type imports use `import type` syntax
3. Hard refresh browser: Ctrl+Shift+R

### Issue: Port already in use
**Cause**: Multiple dev servers running
**Solution**:
```bash
# Kill all node processes
pkill -f "node --watch"
pkill -f "vite"
```

### Issue: CORS errors
**Cause**: Backend not running, frontend API_BASE_URL misconfigured, or CORS origin mismatch
**Check**:
- `frontend/src/services/api.ts` → `const API_BASE_URL = 'http://localhost:3001/api'`
- `backend/src/server.js` → CORS origin should match frontend URL
- Default development: Frontend must run on `http://localhost:5173`

### Issue: CSS styles not loading
**Cause**: Incorrect Tailwind CSS import syntax (using v3 syntax with v4)
**Solution**: Ensure `frontend/src/index.css` has `@import "tailwindcss";` at the top (NOT `@tailwind base/components/utilities`)

## Configuration Points

**Backend port**: `backend/src/server.js` → `const PORT = process.env.PORT || 3001`

**Authentication credentials**: **REQUIRED** - Must be set in `.env` file in project root:
```
AUTH_USERNAME=your_username
AUTH_PASSWORD=your_password
```
- The `.env` file is git-ignored for security
- Backend reads both `AUTH_USERNAME` and `AUTH_PASSWORD` at runtime via getter functions
- `start.sh` loads and exports these variables before starting servers
- Password can be changed via Edit Page UI - new password takes effect immediately (no restart needed)
- Password changes persist to `.env` file

**Frontend API URL**: `frontend/src/services/api.ts` → `const API_BASE_URL`

**Tailwind CSS v4**: This project uses Tailwind CSS v4 with hybrid configuration:
- `frontend/src/index.css` uses `@import "tailwindcss";` (NOT the old `@tailwind` directives)
- `frontend/postcss.config.js` uses `@tailwindcss/postcss` plugin
- `frontend/tailwind.config.js` exists for custom theme extensions (optional with v4):
  - 4 Christian-inspired color palettes: `sacred`, `divine`, `grace`, `heaven`
  - Custom fonts: Crimson Text (serif), Cinzel (display), Inter (sans)
  - Custom gradients: sacred-gradient, divine-gradient, heaven-radial
  - Custom shadows: sacred, divine, soft
- **CRITICAL**: Never change `@import "tailwindcss";` to `@tailwind base/components/utilities` - this will break CSS generation

## Data Model Relationships

```
courses (1) ──< verses (many)
   │
   ├──── study_content (1:1, unique constraint on course_id)
   │
   └──── schedule (0..1, optional link via course_id, ON DELETE SET NULL)
```

**Core Tables**:
- `courses`: id, name, course_date, course_time, leader, visible, created_at, updated_at
- `verses`: id, course_id, gospel, chapter, verse_number, content, explanation, order_index
- `study_content`: id, course_id, content, reference_text
- `schedule`: id, course_date, course_time, course_name, leader, visible, is_manual, course_id, created_at, updated_at

**Cascade deletes**: Deleting a course removes all associated verses and study_content. Schedule items with course_id link get set to NULL (become manual entries).

**Verse ordering**: Verses automatically sorted by chapter, then verse_number in UI. `order_index` field stored but not actively used for display order.

**Course visibility**: Courses with `visible=0` are hidden from Study Page but visible in Edit Page.

**Schedule types**:
- Manual entries (`is_manual=1`): Created directly in Schedule Manager
- Auto-populated entries (`is_manual=0`): Created from courses with dates, linked via `course_id`

## Environment Setup

**Required Files** (git-ignored):
- `.env` - Contains `AUTH_USERNAME=your_username` and `AUTH_PASSWORD=your_password` (backend authentication)
- `start.sh` - Startup script (displays password, hence git-ignored)

**First-time setup**:
1. Create `.env` file in project root with both credentials:
   ```
   AUTH_USERNAME=your_username
   AUTH_PASSWORD=your_password
   ```
2. Run `cd backend && npm install`
3. Run `cd frontend && npm install`
4. Database auto-creates on first backend startup

## Testing the Application

1. Start both servers (ensure `.env` with both AUTH_USERNAME and AUTH_PASSWORD exists first)
2. Navigate to `http://localhost:5173/` (Study Page)
3. Test Courses Tab:
   - Expect empty state: "No courses available"
   - Note: Only visible courses show here
4. Test Schedule Tab:
   - Expect empty state: "No schedule available"
5. Navigate to `/edit`, login with username and password from .env file
6. Test Course Creation (Course Tab):
   - Create course with name, date, time, leader
   - Toggle visibility (eye icon) - course appears/disappears from Study Page
   - Test inline editing (click edit icon)
7. Test Verse Management (Verse Tab):
   - Add verses with gospel, chapter, verse number, content, explanation
   - Verify automatic sorting by chapter/verse number
   - Test inline editing (click edit icon on each verse)
8. Test Schedule Management (Schedule Tab):
   - Click "Auto-populate from Courses" to create schedule from courses with dates
   - Create manual schedule entry
   - Toggle visibility (eye icon)
   - Edit schedule item (syncs to linked course if auto-populated)
9. Return to Study Page:
   - Courses Tab: Click course → Test PC/Mobile mode toggle
   - PC Mode: Click verse to see explanation below, drag bottom edge to resize verses card
   - Mobile Mode: Click verse to expand inline explanation
   - Schedule Tab: View upcoming schedule (past dates auto-hidden)
10. (Optional) Test password change: Scroll to bottom of Edit Page → Click "Change Password" → Enter and confirm new password → Logout → Login with new password

## Files to Reference

- `design.md` - Complete technical design document
- `demand.md` - Original project requirements
- `TROUBLESHOOTING.md` - Debugging guide for common issues
- `README.md` - User-facing documentation
