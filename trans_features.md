# trans1.0 → master: Features to Sync

Features, functions, data content, and UI styles present in **trans1.0 (`75f16ce`)** that are **missing from master (`10fc523`)**.

---

## Database Schema — New Columns

| Table | New Columns |
|---|---|
| `courses` | `language TEXT DEFAULT 'zh'`, `name_zh`, `name_en` |
| `verses` | `content_zh`, `content_en`, `explanation_zh`, `explanation_en` |
| `study_content` | `content_zh`, `content_en`, `reference_text_zh`, `reference_text_en` |
| `schedule` | `course_name_zh`, `course_name_en` |

Migration also backfills existing data: existing `name` → `name_zh`, `content` → `content_zh`, etc.

---

## New Route & Page

1. **`/translation/:courseId` route** — `TranslationPage` component (entirely new)
   - Per-row "Translate" button for each item (course name, verse content, verse explanation, study content, references)
   - "Translate All" / "Translate Untranslated Only" choice dialog
   - Calls `/api/translate` and `/api/translate/save` endpoints
   - Shows side-by-side original vs. translated columns
   - Translation progress tracking
   - "Back to Edit Page" button with state to auto-restore course + verse tab

---

## New API Functions (`services/api.ts`)

2. **`translateAPI`** — entirely new object:
   - `translateAPI.checkHealth()` — calls `GET /api/translate/health`
   - `translateAPI.translate(paragraph)` — calls `POST /api/translate`
   - `translateAPI.saveTranslation(courseId, type, translatedText, targetLang, itemId?)` — calls `POST /api/translate/save`

3. **`getAuthToken()`** — new exported function (reads the current auth token)

4. **`scheduleAPI.create()` / `scheduleAPI.update()`** — now accept `course_name_zh` and `course_name_en` fields

---

## New Data Types (`types/index.ts`)

5. **`TranslationResult`** type (`translated_paragraph`, `detected_language`, `target_language`, `bible_version?`)
6. **`TranslationHealth`** type (`healthy`, `error?`)
7. Bilingual fields added to `Course`: `language`, `name_zh?`, `name_en?`
8. Bilingual fields added to `Verse`: `content_zh?`, `content_en?`, `explanation_zh?`, `explanation_en?`
9. Bilingual fields added to `StudyContent`: `content_zh?`, `content_en?`, `reference_text_zh?`, `reference_text_en?`
10. Bilingual fields added to `Schedule`: `course_name_zh?`, `course_name_en?`

---

## CourseEditor Changes

11. **Course Language selector** in the "Add Course" form — dropdown to choose Chinese / English (sets `language` field)
12. **Course Language display** in the inline edit form — read-only label showing current course language
13. **ZH / EN badge** next to every course name in the course list (red = ZH, blue = EN)
14. **Localized course name display** — uses `getLocalizedText(name_zh, name_en)` throughout, respects current UI language
15. **Language note info banner** (amber) in the Course Details section when a course is selected (tells editor which language to use)
16. **Auto-return navigation**: when navigating back from `TranslationPage`, auto-selects the correct course and switches to the Verse tab (via `location.state`)

---

## VerseEditor Changes

17. **Language warning banner** (amber) in the "Add Verse" form — reminds editor to use the course's original language
18. **Language warning banner** (amber) in the inline "Edit Verse" form
19. **Localized verse content display** in the verse list — shows `content_zh`/`content_en` based on UI language
20. **Localized verse explanation display** in the verse list — shows `explanation_zh`/`explanation_en`
21. Accepts new `courseLanguage` prop (passed from CourseEditor)

---

## StudyContentEditor Changes

22. **Language warning banner** (amber) above the Study Notes textarea
23. **Language warning banner** (amber) above the References textarea
24. **"Translation" button** (purple) — navigates to `/translation/:courseId`; sits alongside the Save button
25. **Language-aware save** — when viewing English translation, saves to `_en` columns via `translateAPI.saveTranslation()` instead of overwriting the source

---

## StudyPage Changes

26. **Localized course name** on course cards (uses `name_zh`/`name_en`)
27. **Localized course name** in the selected-course header
28. **Localized verse content** in the verse text display
29. **Localized verse explanation** in the inline (mobile) expansion
30. **Localized verse explanation** in the PC mode explanation card
31. **Localized study notes** display
32. **Localized references** display
33. **Verse heading** changed to use i18n key `verse.verseHeading` (e.g. "第3节" / "Verse 3") instead of hardcoded `gospel chapter:verse_number`

---

## ScheduleManager Changes

34. **Bilingual course name entry** — course name field replaced with ZH/EN toggle tab switching between `course_name_zh` and `course_name_en` inputs (both in add-form and inline edit rows)
35. **Localized course name display** in the schedule table — uses `getLocalizedText(course_name_zh, course_name_en)` with fallback to `course_name`

---

## ScheduleView Changes

36. **Localized course name display** — uses `getLocalizedText(course_name_zh, course_name_en)` with fallback to `course_name`

---

## Auth Token Persistence

37. **`authToken` initialized from `sessionStorage`** on module load — survives page refresh within the browser session
38. **`setAuthToken()`** now also writes to `sessionStorage`
39. **`clearAuthToken()`** now also removes from `sessionStorage`

---

## New i18n Keys (both `zh.json` and `en.json`)

40. `course.language`, `course.languageChinese`, `course.languageEnglish`, `course.languageNote`, `course.editLanguageNote`
41. Entire `translation.*` namespace (26 keys): `translate`, `editTranslation`, `translationPage`, `original`, `translated`, `progress`, `submit`, `saveSuccess`, `saving`, `translating`, `completed`, `courseName`, `verseContent`, `verseExplanation`, `studyContent`, `references`, `errorTitle`, `errorMessage`, `connectionError`, `backToEdit`, `translationNotAvailable`, `sourceLanguage`, `targetLanguage`, `swapLanguages`, `translateItem`, `noContent`, `translateChoiceTitle`, `translateChoiceMessage`, `translateChoiceAll`, `translateChoiceUntranslated`
42. `verse.verseHeading`
