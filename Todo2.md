# Todo List: Port CF_dev Features to Master Branch

## Phase 1: Database Schema Updates
- [x] Update `backend/src/db/schema.sql` - Add `schedule` table
- [x] Update `backend/src/db/schema.sql` - Modify `courses` table (add course_date, course_time, leader, visible)
- [x] Update `backend/src/db/schema.sql` - Create indexes

## Phase 2: Backend API Implementation
- [x] Create `backend/src/routes/schedule.js` - All 8 schedule endpoints
- [x] Update `backend/src/routes/courses.js` - Add GET /api/courses/all endpoint
- [x] Update `backend/src/routes/courses.js` - Modify endpoints for new fields
- [x] Update `backend/src/server.js` - Import and mount schedule routes

## Phase 3: Frontend Types & API Client
- [x] Update `frontend/src/types/index.ts` - Add Schedule type
- [x] Update `frontend/src/types/index.ts` - Extend Course type
- [x] Update `frontend/src/services/api.ts` - Add 8 schedule API functions
- [x] Update `frontend/src/services/api.ts` - Add getAllCoursesIncludingHidden()
- [x] Update `frontend/src/services/api.ts` - Update course functions for new fields

## Phase 4: New Frontend Components
- [x] Create `frontend/src/components/ScheduleView.tsx`
- [x] Create `frontend/src/components/ScheduleManager.tsx`

## Phase 5: Update Existing Components
- [x] Update `frontend/src/components/StudyPage.tsx` - Add schedule tab
- [x] Update `frontend/src/components/StudyPage.tsx` - Add PC/Mobile toggle
- [x] Update `frontend/src/components/StudyPage.tsx` - Implement resizable verses card
- [x] Update `frontend/src/components/StudyPage.tsx` - Implement inline explanations (mobile mode)
- [x] Update `frontend/src/components/EditPage.tsx` - Add Schedule Management tab
- [x] Update `frontend/src/components/EditPage.tsx` - Update course list with new fields
- [x] Update `frontend/src/components/EditPage.tsx` - Add inline course editing
- [x] Update `frontend/src/components/EditPage.tsx` - Add visibility toggle
- [x] Update `frontend/src/components/CourseEditor.tsx` - Add new fields to form
- [x] Update `frontend/src/components/VerseEditor.tsx` - Add edit button per verse
- [x] Update `frontend/src/components/VerseEditor.tsx` - Implement inline edit form
- [x] Update `frontend/src/components/VerseEditor.tsx` - Add verse sorting

## Phase 6: UI Styling Enhancements
- [x] Create `frontend/tailwind.config.js` - Add custom themes
- [x] Update component styling - Icons, zebra striping, hover effects

## Phase 7: Translations
- [x] Update `frontend/src/i18n/zh.json` - Add all new translation keys
- [x] Update `frontend/src/i18n/en.json` - Add all new translation keys

## Phase 8: Testing & Verification
- [ ] Test database migrations
- [ ] Test schedule CRUD operations
- [ ] Test course visibility toggles
- [ ] Test PC/Mobile view mode switching
- [ ] Test resizable verses card
- [ ] Test inline verse editing
- [ ] Test auto-populate and sync functionality
- [ ] Verify translations in both languages

---

## Progress Summary
- Total Tasks: 38
- Completed: 30
- Remaining: 8 (Testing & Verification)
