# Bible Study Group Teaching Document Management

A web application for managing and displaying Bible study course materials with bilingual support (Chinese/English).

## Features

- 📖 **Study Page (Public)**: Browse and view Bible study courses
  - Course list display
  - Interactive Bible verses with explanations
  - Study content and references

- ✏️ **Edit Page (Protected)**: Create and manage courses
  - Password protection (set in `.env` file)
  - Course creation and deletion
  - Bible verse management (Gospel, Chapter, Verse, Content, Explanation)
  - Study content and references editor

- 🌐 **Bilingual Support**: Switch between Chinese (中文) and English
- 💾 **Local Data Storage**: SQLite database for all course data

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- React Router (Navigation)
- React i18next (Internationalization)

### Backend
- Node.js with Express
- SQLite with better-sqlite3
- RESTful API

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd /media/robert/roblinux/claude_Code/CH_bible_study
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

You need to run both the backend and frontend servers:

#### Terminal 1 - Start Backend Server
```bash
cd backend
npm run dev
```
The API server will run on `http://localhost:3001`

#### Terminal 2 - Start Frontend Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173` (or next available port)

### Accessing the Application

1. **Study Page (Public)**: `http://localhost:5173/`
   - View all courses and their content
   - Click verses to see explanations
   - No authentication required

2. **Edit Page (Protected)**: `http://localhost:5173/edit`
   - Password: Set in `.env` file
   - Create and manage courses
   - Add Bible verses with explanations
   - Edit study content and references

## Usage Guide

### Creating a Course

1. Go to the Edit page (`/edit`)
2. Enter the password from your `.env` file
3. Enter a course name and click "Create Course"
4. Select the course from the list

### Adding Bible Verses

1. In the Edit page, select a course
2. Fill in the verse form:
   - Gospel (e.g., "John")
   - Chapter (e.g., 3)
   - Verse Number (e.g., 16)
   - Verse Content
   - Verse Explanation (optional)
3. Click "Add Verse"

### Adding Study Content

1. In the Edit page, select a course
2. Scroll to "Study Content/References" section
3. Enter study notes and references
4. Click "Save"

### Viewing Courses (Study Page)

1. Go to the Study page (`/`)
2. Click on a course from the list
3. Click on any verse to see its explanation
4. View study content and references at the bottom

## Project Structure

```
bible-study-app/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── init.js          # Database initialization
│   │   │   └── schema.sql       # Database schema
│   │   ├── middleware/
│   │   │   └── auth.js          # Authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js          # Auth endpoints
│   │   │   ├── courses.js       # Course CRUD
│   │   │   ├── verses.js        # Verse CRUD
│   │   │   └── studyContent.js  # Study content endpoints
│   │   └── server.js            # Express server
│   ├── package.json
│   └── database.sqlite          # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   ├── StudyPage.tsx
│   │   │   ├── EditPage.tsx
│   │   │   ├── CourseEditor.tsx
│   │   │   ├── VerseEditor.tsx
│   │   │   └── StudyContentEditor.tsx
│   │   ├── i18n/
│   │   │   ├── config.ts
│   │   │   ├── en.json
│   │   │   └── zh.json
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── design.md                     # Design documentation
├── todo.md                       # Development progress
├── demand.md                     # Project requirements
└── README.md                     # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Verify password

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course with details
- `POST /api/courses` - Create course (requires auth)
- `PUT /api/courses/:id` - Update course (requires auth)
- `DELETE /api/courses/:id` - Delete course (requires auth)

### Verses
- `POST /api/verses` - Add verse (requires auth)
- `POST /api/verses/bulk` - Bulk add verses (requires auth)
- `PUT /api/verses/:id` - Update verse (requires auth)
- `DELETE /api/verses/:id` - Delete verse (requires auth)

### Study Content
- `GET /api/study-content/:courseId` - Get study content
- `POST /api/study-content` - Save study content (requires auth)

## Configuration

### Change Authentication Password

Edit `.env` file in the project root:
```
AUTH_PASSWORD=your_new_password
```

### Change API Port

Edit `backend/src/server.js` or set environment variable:
```bash
export PORT=3001
```

### Change Frontend API URL

Edit `frontend/src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:3001/api';
```

## Database Schema

### courses
- `id` - Primary key
- `name` - Course name
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### verses
- `id` - Primary key
- `course_id` - Foreign key to courses
- `gospel` - Gospel name
- `chapter` - Chapter number
- `verse_number` - Verse number
- `content` - Verse text
- `explanation` - Verse explanation
- `order_index` - Display order

### study_content
- `id` - Primary key
- `course_id` - Foreign key to courses (unique)
- `content` - Study notes
- `references` - Reference materials

## Local Network Access

To share the app with other users on your local network:

1. Find your local IP address:
   ```bash
   # Linux/Mac
   ip addr show
   # or
   ifconfig
   ```

2. Update frontend API URL to use your IP instead of localhost

3. Share your IP address with users (e.g., `http://192.168.1.100:5173`)

## Troubleshooting

### Backend won't start
- Check if port 3001 is already in use
- Ensure all dependencies are installed: `npm install`

### Frontend won't start
- Check if port 5173 is already in use
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Database errors
- Delete `backend/database.sqlite` to reset the database
- Restart the backend server

### CORS errors
- Ensure backend is running on port 3001
- Check API_BASE_URL in `frontend/src/services/api.ts`

## Development

### Build for Production

Frontend:
```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/`

### Run Production Build

Serve the frontend build with the backend:
```bash
# Add static file serving to backend/src/server.js
app.use(express.static('../frontend/dist'));
```

## License

MIT

## Support

For issues or questions, please refer to the demand.md and design.md files for project specifications.
