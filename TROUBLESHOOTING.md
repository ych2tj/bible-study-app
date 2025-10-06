# Troubleshooting Guide

## Issue: Blank/White Page in Browser

If you see a blank page when opening http://localhost:5173/, follow these steps:

### Step 1: Check Browser Console

1. Open Chrome Developer Tools (press **F12**)
2. Click on the **Console** tab
3. Look for any **red error messages**

Common errors and solutions:

#### Error: "Cannot find module" or "Failed to fetch module"
**Solution**: Reinstall frontend dependencies
```bash
cd frontend
rm -rf node_modules
npm install
```

#### Error: "Failed to fetch" or "Network error" when calling API
**Solution**: Make sure backend is running
```bash
# Check if backend is running
curl http://localhost:3001/api/courses

# If not, start it
cd backend
npm run dev
```

#### Error: Related to i18next or translations
**Solution**: The i18n configuration might have an issue. Try this simplified version:
```bash
# Edit frontend/src/i18n/config.ts and restart frontend
```

### Step 2: Check if Both Servers are Running

**Backend (should show API endpoints):**
```bash
cd backend
npm run dev
```
Should show:
```
🚀 Server is running on http://localhost:3001
📖 Bible Study API ready
```

**Frontend (should show Vite info):**
```bash
cd frontend
npm run dev
```
Should show:
```
  VITE v7.x.x  ready in XXXms
  ➜  Local:   http://localhost:5173/
```

### Step 3: Test Backend API Directly

Open your browser and go to:
- http://localhost:3001/api/courses

You should see: `[]` (empty array)

If you see an error, the backend is not running properly.

### Step 4: Test with Simple App

Temporarily replace the App to test if React is working:

```bash
cd frontend/src
mv App.tsx App-full.tsx
mv App-simple.tsx App.tsx
```

Refresh browser. If you see "Bible Study App Test", React is working.

Then restore:
```bash
mv App.tsx App-simple-backup.tsx
mv App-full.tsx App.tsx
```

### Step 5: Check Network Tab

In Chrome Dev Tools:
1. Click **Network** tab
2. Refresh the page (F5)
3. Look for any failed requests (red status codes)

Common issues:
- **Failed to load main.tsx**: Frontend build issue, restart Vite
- **404 on API calls**: Backend not running or wrong URL
- **CORS error**: Backend CORS not configured (already should be)

### Step 6: Clear Browser Cache

Sometimes browser cache causes issues:
1. Press **Ctrl + Shift + Delete**
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page (F5)

### Step 7: Restart Everything

```bash
# Kill all processes
pkill -f "node --watch"
pkill -f "vite"

# Start fresh
cd backend
npm run dev

# In another terminal
cd frontend
npm run dev
```

### Step 8: Check Port Conflicts

If ports are in use:

**Backend (port 3001):**
```bash
# Check what's using port 3001
lsof -i :3001

# Kill it if needed
kill -9 <PID>
```

**Frontend (port 5173):**
```bash
# Check what's using port 5173
lsof -i :5173

# Kill it if needed
kill -9 <PID>
```

## Common Solutions

### Solution 1: Fresh Install
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Solution 2: Use Start Script
```bash
cd /media/robert/roblinux/claude_Code/CH_bible_study
./start.sh
```

### Solution 3: Check Node Version
```bash
node --version
# Should be v18 or higher
```

If lower, update Node.js.

## Still Having Issues?

Please provide:
1. Error messages from browser console (F12 → Console tab)
2. Error messages from terminal where you ran `npm run dev`
3. Output of:
   ```bash
   curl http://localhost:3001/api/courses
   curl http://localhost:5173/
   ```

## Quick Test Commands

```bash
# Test if backend is responding
curl http://localhost:3001/api/courses

# Test if frontend HTML is loading
curl http://localhost:5173/ | grep "root"

# Check running processes
ps aux | grep node
ps aux | grep vite
```
