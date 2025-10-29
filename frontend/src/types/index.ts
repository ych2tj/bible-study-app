export type Course = {
  id: number;
  name: string;
  course_date?: string;
  course_time?: string;
  leader?: string;
  visible: number; // 0 = hidden, 1 = visible
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
}

export type StudyContent = {
  id?: number;
  course_id: number;
  content: string;
  reference_text: string;
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
  created_at: string;
  updated_at: string;
}
