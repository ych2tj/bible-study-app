import type { Course, CourseDetail, Verse, StudyContent, Schedule, TranslationResult, TranslationHealth } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

let authToken: string | null = sessionStorage.getItem('authToken');

export const setAuthToken = (token: string) => {
  authToken = token;
  sessionStorage.setItem('authToken', token);
};

export const clearAuthToken = () => {
  authToken = null;
  sessionStorage.removeItem('authToken');
};

export const getAuthToken = () => authToken;

const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (response.ok) {
      setAuthToken(password);
      return true;
    }
    return false;
  },

  changePassword: async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }
    const result = await response.json();
    // Update token with new password
    setAuthToken(newPassword);
    return result;
  },
};

// Courses API
export const coursesAPI = {
  getAll: async (): Promise<Course[]> => {
    const response = await fetch(`${API_BASE_URL}/courses`);
    if (!response.ok) throw new Error('Failed to fetch courses');
    return response.json();
  },

  getAllIncludingHidden: async (): Promise<Course[]> => {
    const response = await fetch(`${API_BASE_URL}/courses/all`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch courses');
    return response.json();
  },

  getById: async (id: number): Promise<CourseDetail> => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`);
    if (!response.ok) throw new Error('Failed to fetch course');
    return response.json();
  },

  create: async (courseData: { name: string; course_date?: string; course_time?: string; leader?: string; visible?: number; language?: string }): Promise<Course> => {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    });
    if (!response.ok) throw new Error('Failed to create course');
    return response.json();
  },

  update: async (id: number, courseData: { name: string; course_date?: string; course_time?: string; leader?: string; visible?: number; language?: string }): Promise<Course> => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    });
    if (!response.ok) throw new Error('Failed to update course');
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete course');
  },
};

// Verses API
export const versesAPI = {
  create: async (verse: Omit<Verse, 'id'>): Promise<Verse> => {
    const response = await fetch(`${API_BASE_URL}/verses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(verse),
    });
    if (!response.ok) throw new Error('Failed to create verse');
    return response.json();
  },

  bulkCreate: async (courseId: number, verses: Omit<Verse, 'id' | 'course_id'>[]): Promise<Verse[]> => {
    const response = await fetch(`${API_BASE_URL}/verses/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ course_id: courseId, verses }),
    });
    if (!response.ok) throw new Error('Failed to create verses');
    return response.json();
  },

  update: async (id: number, verse: Partial<Verse>): Promise<Verse> => {
    const response = await fetch(`${API_BASE_URL}/verses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(verse),
    });
    if (!response.ok) throw new Error('Failed to update verse');
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/verses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete verse');
  },
};

// Study Content API
export const studyContentAPI = {
  get: async (courseId: number): Promise<StudyContent> => {
    const response = await fetch(`${API_BASE_URL}/study-content/${courseId}`);
    if (!response.ok) throw new Error('Failed to fetch study content');
    return response.json();
  },

  save: async (courseId: number, content: string, references: string): Promise<StudyContent> => {
    const response = await fetch(`${API_BASE_URL}/study-content`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ course_id: courseId, content, references }),
    });
    if (!response.ok) throw new Error('Failed to save study content');
    return response.json();
  },
};

// Schedule API
export const scheduleAPI = {
  getAll: async (): Promise<Schedule[]> => {
    const response = await fetch(`${API_BASE_URL}/schedule`);
    if (!response.ok) throw new Error('Failed to fetch schedule');
    return response.json();
  },

  getAllIncludingHidden: async (): Promise<Schedule[]> => {
    const response = await fetch(`${API_BASE_URL}/schedule/all`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch schedule');
    return response.json();
  },

  getById: async (id: number): Promise<Schedule> => {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`);
    if (!response.ok) throw new Error('Failed to fetch schedule item');
    return response.json();
  },

  create: async (scheduleData: {
    course_date: string;
    course_time?: string;
    course_name: string;
    course_name_zh?: string;
    course_name_en?: string;
    leader?: string;
    visible?: number;
    is_manual?: number;
    course_id?: number;
  }): Promise<{ id: number }> => {
    const response = await fetch(`${API_BASE_URL}/schedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) throw new Error('Failed to create schedule item');
    return response.json();
  },

  update: async (id: number, scheduleData: {
    course_date: string;
    course_time?: string;
    course_name: string;
    course_name_zh?: string;
    course_name_en?: string;
    leader?: string;
    visible?: number;
    is_manual?: number;
  }): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) throw new Error('Failed to update schedule item');
    return response.json();
  },

  toggleVisibility: async (id: number): Promise<{ visible: number }> => {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}/visibility`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to toggle visibility');
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete schedule item');
  },

  autoPopulate: async (): Promise<{ added: number; updated: number; message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/schedule/auto-populate`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to auto-populate schedule');
    return response.json();
  },

  syncFromCourses: async (): Promise<{ updated: number; message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/schedule/sync-from-courses`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to sync from courses');
    return response.json();
  },
};

// Translation API
export const translateAPI = {
  checkHealth: async (): Promise<TranslationHealth> => {
    const response = await fetch(`${API_BASE_URL}/translate/health`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      return { healthy: false, error: 'api_error' };
    }
    return response.json();
  },

  translate: async (paragraph: string): Promise<TranslationResult> => {
    const response = await fetch(`${API_BASE_URL}/translate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ paragraph }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Translation failed');
    }
    return response.json();
  },

  saveTranslation: async (
    courseId: number,
    type: 'course_name' | 'verse_content' | 'verse_explanation' | 'study_content' | 'reference_text',
    translatedText: string,
    targetLang: 'zh' | 'en',
    itemId?: number
  ): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/translate/save`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ courseId, type, itemId, translatedText, targetLang }),
    });
    if (!response.ok) throw new Error('Failed to save translation');
    return response.json();
  },
};
