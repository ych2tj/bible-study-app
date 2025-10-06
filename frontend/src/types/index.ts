export type Course = {
  id: number;
  name: string;
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
