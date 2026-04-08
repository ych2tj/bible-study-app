export type Course = {
  id: number;
  name: string;
  course_date?: string;
  course_time?: string;
  leader?: string;
  visible: number; // 0 = hidden, 1 = visible
  language: string; // 'zh' or 'en'
  name_zh?: string | null;
  name_en?: string | null;
  created_at: string;
  updated_at: string;
}

export type Verse = {
  id: number;
  course_id: number;
  gospel: string;
  chapter: number;
  verse_number: number;
  content: string;
  explanation: string;
  order_index: number;
  content_zh?: string | null;
  content_en?: string | null;
  explanation_zh?: string | null;
  explanation_en?: string | null;
}

export type StudyContent = {
  id?: number;
  course_id: number;
  content: string;
  reference_text: string;
  content_zh?: string | null;
  content_en?: string | null;
  reference_text_zh?: string | null;
  reference_text_en?: string | null;
}

export type CourseDetail = Course & {
  verses: Verse[];
  studyContent: StudyContent;
}

export type Schedule = {
  id: number;
  course_date: string;
  course_time?: string;
  course_name: string;
  leader?: string;
  visible: number; // 0 = hidden, 1 = visible
  is_manual: number; // 0 = auto-populated, 1 = manually created
  course_id?: number; // Foreign key to courses table
  course_name_zh?: string | null;
  course_name_en?: string | null;
  created_at: string;
  updated_at: string;
}

export type TranslationResult = {
  translated_paragraph: string;
  detected_language: string;
  target_language: string;
  bible_version?: string;
}

export type TranslationHealth = {
  healthy: boolean;
  error?: string;
}
