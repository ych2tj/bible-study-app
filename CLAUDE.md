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
- Configures CORS (allows all origins)
- Database initialization runs on import of any route

**Route Organization**:
- `routes/auth.js` - Password verification (POST /api/auth/login) and password change (POST /api/auth/change-password)
- `routes/courses.js` - Full CRUD for courses
- `routes/verses.js` - Verse CRUD + bulk operations
- `routes/studyContent.js` - Study content per course (one-to-one relationship)

**Authentication Pattern**:
- Simple Bearer token in Authorization header
- Token = the actual password
- `middleware/auth.js` uses `getAuthPassword()` getter function to read `process.env.AUTH_PASSWORD` dynamically (NOT cached at startup)
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
    └── Route "/edit" → EditPage
                        ├── CourseEditor
                        │   ├── VerseEditor
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

### Issue: CSS styles not loading
**Cause**: Incorrect Tailwind CSS import syntax (using v3 syntax with v4)
**Solution**: Ensure `frontend/src/index.css` has `@import "tailwindcss";` at the top (NOT `@tailwind base/components/utilities`)

## Configuration Points

**Backend port**: `backend/src/server.js` → `const PORT = process.env.PORT || 3001`

**Auth password**: **REQUIRED** - Must be set in `.env` file in project root → `AUTH_PASSWORD=your_password`
- The `.env` file is git-ignored for security
- Backend reads `process.env.AUTH_PASSWORD` at runtime via getter function
- `start.sh` loads and exports this variable before starting servers
- Password can be changed via Edit Page UI - new password takes effect immediately (no restart needed)
- Password changes persist to `.env` file

**Frontend API URL**: `frontend/src/services/api.ts` → `const API_BASE_URL`

**Tailwind CSS v4**: This project uses Tailwind CSS v4 with the new configuration system:
- `frontend/src/index.css` uses `@import "tailwindcss";` (NOT the old `@tailwind` directives)
- `frontend/postcss.config.js` uses `@tailwindcss/postcss` plugin
- No `tailwind.config.js` file is needed for v4 (CSS-based configuration)
- **CRITICAL**: Never change `@import "tailwindcss";` to `@tailwind base/components/utilities` - this will break CSS generation

## Data Model Relationships

```
courses (1) ──< verses (many)
   │
   └──── study_content (1:1, unique constraint on course_id)
```

**Cascade deletes**: Deleting a course removes all associated verses and study_content

**Verse ordering**: `order_index` field determines display sequence (set to `verses.length` when adding new)

## Environment Setup

**Required Files** (git-ignored):
- `.env` - Contains `AUTH_PASSWORD=your_password` (backend authentication)
- `start.sh` - Startup script (displays password, hence git-ignored)

**First-time setup**:
1. Create `.env` file in project root with `AUTH_PASSWORD=your_password`
2. Run `cd backend && npm install`
3. Run `cd frontend && npm install`
4. Database auto-creates on first backend startup

## Testing the Application

1. Start both servers (ensure `.env` exists first)
2. Navigate to `http://localhost:5173/` (Study Page)
3. Expect empty state: "No courses available"
4. Navigate to `/edit`, login with password from .env file
5. Create course → Add verses → Add study content
6. Return to Study Page → Click course → Click verse to see explanation
7. (Optional) Test password change: Scroll to bottom of Edit Page → Click "Change Password" → Enter and confirm new password → Refresh page and login with new password

## Files to Reference

- `design.md` - Complete technical design document
- `demand.md` - Original project requirements
- `TROUBLESHOOTING.md` - Debugging guide for common issues
- `README.md` - User-facing documentation
