# Bible Study Group Teaching Document Management - Design Plan

## Application Overview

A web application for managing and displaying Bible study course materials with bilingual support (Chinese/English) for 10-20 users in a local development environment.

---

## Application Architecture

### Two Main Pages

#### 1. Edit Page (Password-Protected)
- **Authentication**: Password protection (set in `.env` file)
- **Course Management**: Create and manage study courses
- **Bible Verse Entry**: Structured input with:
  - Gospel name
  - Chapter number
  - Verse number
  - Verse content
  - Verse explanation
- **Study Content Section**: Independent text area for study content and references
- **Save Functionality**: Save courses and their content

#### 2. Study Page (Public Access)
- **Course List**: Display all created courses
- **Course Content Viewer**: Three interactive sections:
  - **"Bible Verses" Box**: Clickable verses with verse numbers displayed in front
  - **"Verses Explanation" Box**: Dynamically displays explanation when a verse is clicked
  - **"Study Content/References" Box**: Shows study materials and references

---

## Technology Stack (Option 1 - Recommended)

### Frontend
- **React** with **TypeScript** - Component-based UI with type safety
- **Vite** - Modern, fast build tool
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **React i18next** - Internationalization library for Chinese/English bilingual support
- **React Router** - Client-side routing for page navigation

### Backend
- **Node.js** with **Express.js** - Lightweight REST API server
- **SQLite** - File-based relational database (perfect for local development)
- **Better-sqlite3** - Synchronous SQLite driver for Node.js

### Why This Stack?
✅ Easy local development and deployment
✅ No complex database setup (SQLite is single-file)
✅ Modern, maintainable codebase
✅ Perfect for 10-20 user groups
✅ Excellent internationalization support
✅ Type safety with TypeScript
✅ Fast development with Vite and Tailwind CSS

---

## Database Schema (SQLite)

### Tables

#### `courses`
```sql
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `verses`
```sql
CREATE TABLE verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    gospel TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    explanation TEXT,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

#### `study_content`
```sql
CREATE TABLE study_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    content TEXT,
    references TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Verify password

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get specific course with all content
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Verses
- `POST /api/courses/:id/verses` - Add verse to course
- `PUT /api/verses/:id` - Update verse
- `DELETE /api/verses/:id` - Delete verse

### Study Content
- `POST /api/courses/:id/study-content` - Add/update study content
- `GET /api/courses/:id/study-content` - Get study content for course

---

## Project Structure

```
bible-study-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EditPage.tsx          # Password-protected edit interface
│   │   │   ├── StudyPage.tsx         # Public study interface
│   │   │   ├── CourseEditor.tsx      # Course creation/editing form
│   │   │   ├── VerseEditor.tsx       # Bible verse input form
│   │   │   ├── CourseViewer.tsx      # Course content display
│   │   │   ├── VerseList.tsx         # Clickable verse list
│   │   │   └── LanguageSwitcher.tsx  # Chinese/English toggle
│   │   ├── i18n/
│   │   │   ├── zh.json               # Chinese translations
│   │   │   └── en.json               # English translations
│   │   ├── hooks/
│   │   │   ├── useCourses.ts         # Course data fetching
│   │   │   └── useAuth.ts            # Authentication state
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js               # Authentication routes
│   │   │   ├── courses.js            # Course CRUD routes
│   │   │   └── verses.js             # Verse CRUD routes
│   │   ├── db/
│   │   │   ├── init.js               # Database initialization
│   │   │   └── schema.sql            # Database schema
│   │   ├── middleware/
│   │   │   └── auth.js               # Password verification
│   │   └── server.js                 # Express app entry point
│   ├── package.json
│   └── database.sqlite               # SQLite database file
├── README.md
└── .gitignore
```

---

## Implementation Plan

### Phase 1: Project Setup
1. Initialize frontend with React + Vite + TypeScript
2. Initialize backend with Node.js + Express
3. Set up SQLite database with schema
4. Configure Tailwind CSS
5. Set up i18next for bilingual support

### Phase 2: Backend Development
1. Create database initialization script
2. Implement course CRUD API endpoints
3. Implement verse CRUD API endpoints
4. Implement study content API endpoints
5. Add password authentication middleware

### Phase 3: Frontend Core
1. Set up React Router (Edit Page, Study Page)
2. Configure i18next with Chinese/English translations
3. Create base layout and navigation
4. Implement language switcher component

### Phase 4: Edit Page (Protected)
1. Password authentication form
2. Course creation/editing form
3. Bible verse editor with fields:
   - Gospel name
   - Chapter number
   - Verse number
   - Verse content
   - Verse explanation
4. Study content and references editor
5. Save functionality for courses and verses

### Phase 5: Study Page (Public)
1. Course list display component
2. Course viewer with three sections:
   - Bible Verses box (clickable verses)
   - Verses Explanation box (dynamic display)
   - Study Content/References box
3. Implement verse click interaction
4. Display bilingual content

### Phase 6: Testing & Polish
1. Test all CRUD operations
2. Test bilingual switching
3. Test password authentication
4. Ensure responsive design for different screen sizes
5. Add loading states and error handling
6. Optimize performance

---

## Key Features Implementation Details

### Bilingual Support
- Use i18next for UI translations
- Store all user-generated content (verses, explanations, study content) in the database as-is
- Provide UI language toggle between Chinese and English

### Password Protection
- Simple session-based authentication for Edit Page
- Password stored in `.env` file
- Session expires on browser close or after timeout

### Interactive Verse Display
- Each verse is a clickable element
- On click, display corresponding explanation in "Verses Explanation" box
- Highlight selected verse for better UX

### Data Persistence
- All data stored in SQLite database
- Auto-save functionality to prevent data loss
- Proper foreign key relationships for data integrity

---

## Development Environment Requirements

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Development Commands
```bash
# Frontend
cd frontend
npm install
npm run dev          # Start development server

# Backend
cd backend
npm install
npm run dev          # Start API server

# Production Build
cd frontend
npm run build        # Build for production
```

---

## Deployment (Local Network)

For local development with 10-20 users:

1. **Backend**: Run Express server on local machine
2. **Frontend**: Serve built files via Express static middleware
3. **Access**: Other users access via local IP address (e.g., `http://192.168.1.100:3000`)
4. **Database**: SQLite file stored on server machine

### Simple Deployment Option
- Build frontend: `npm run build`
- Serve both frontend and API from single Express server
- Share local IP address with users on same network

---

## Future Enhancements (Optional)

- User accounts with different permission levels
- Rich text editor for study content
- Export courses to PDF
- Search functionality across courses and verses
- Course categories/tags
- Backup and restore functionality
- Mobile-responsive design improvements
- Dark mode support

---

## Security Considerations

- Password should be configurable via environment variables
- Consider adding HTTPS for production
- Implement rate limiting on authentication endpoint
- Add CORS configuration for API
- Validate and sanitize all user inputs
- Regular database backups

---

## Estimated Development Timeline

- **Phase 1 (Setup)**: 1-2 days
- **Phase 2 (Backend)**: 2-3 days
- **Phase 3 (Frontend Core)**: 2-3 days
- **Phase 4 (Edit Page)**: 3-4 days
- **Phase 5 (Study Page)**: 3-4 days
- **Phase 6 (Testing & Polish)**: 2-3 days

**Total**: 2-3 weeks for a complete, polished application
