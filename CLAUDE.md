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

1. **Two-Page Application**:
   - **Study Page (/)**: Public access for viewing courses and verses
   - **Edit Page (/edit)**: Password-protected for course management

2. **Interactive Verse System**: Clicking a verse in Study Page dynamically displays its explanation in a separate box below

3. **Database Field Naming**: The `study_content` table uses `reference_text` (NOT `references`) because "references" is a SQL reserved keyword

4. **TypeScript Import Pattern**: Always use `import type { ... } from '../types'` syntax when importing TypeScript types. Regular imports cause Vite module resolution errors.

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

Or use the convenience script:
```bash
./start.sh
```

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
- Configures CORS (allows all origins)
- Database initialization runs on import of any route

**Route Organization**:
- `routes/auth.js` - Password verification (POST /api/auth/login)
- `routes/courses.js` - Full CRUD for courses
- `routes/verses.js` - Verse CRUD + bulk operations
- `routes/studyContent.js` - Study content per course (one-to-one relationship)

**Authentication Pattern**:
- Simple Bearer token in Authorization header
- Token = the actual password (stored in `middleware/auth.js`)
- Public endpoints: GET courses, verses, study content
- Protected endpoints: All POST/PUT/DELETE operations

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
    └── Route "/edit" → EditPage
                        └── CourseEditor
                            ├── VerseEditor
                            └── StudyContentEditor
```

**State Management Pattern**:
- No global state library (Redux, Context, etc.)
- Each page component fetches its own data via `services/api.ts`
- Parent components pass refresh callbacks to children for data invalidation

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

### Critical Database-Frontend Mapping

**IMPORTANT**: The database field is `reference_text`, but the frontend API still sends/receives `references`. The backend handles this mapping:

```javascript
// Backend POST /api/study-content
const { references } = req.body;  // Frontend sends "references"
// But SQL uses: INSERT INTO study_content (..., reference_text) VALUES (..., ?)
```

Frontend types (`types/index.ts`) use:
```typescript
export type StudyContent = {
  reference_text: string;  // Matches actual DB column
}
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

### Component File Naming
All React components use `.tsx` extension (TypeScript + JSX)

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
**Cause**: Backend not running or frontend API_BASE_URL misconfigured
**Check**: `frontend/src/services/api.ts` → `const API_BASE_URL = 'http://localhost:3001/api'`

## Configuration Points

**Backend port**: `backend/src/server.js` → `const PORT = process.env.PORT || 3001`

**Auth password**: Set in `.env` file → `AUTH_PASSWORD=your_password`

**Frontend API URL**: `frontend/src/services/api.ts` → `const API_BASE_URL`

**Tailwind PostCSS**: `frontend/postcss.config.js` uses `@tailwindcss/postcss` (NOT `tailwindcss` directly)

## Data Model Relationships

```
courses (1) ──< verses (many)
   │
   └──── study_content (1:1, unique constraint on course_id)
```

**Cascade deletes**: Deleting a course removes all associated verses and study_content

**Verse ordering**: `order_index` field determines display sequence (set to `verses.length` when adding new)

## Testing the Application

1. Start both servers
2. Navigate to `http://localhost:5173/` (Study Page)
3. Expect empty state: "No courses available"
4. Navigate to `/edit`, login with password from .env file
5. Create course → Add verses → Add study content
6. Return to Study Page → Click course → Click verse to see explanation

## Files to Reference

- `design.md` - Complete technical design document
- `demand.md` - Original project requirements
- `TROUBLESHOOTING.md` - Debugging guide for common issues
- `README.md` - User-facing documentation
