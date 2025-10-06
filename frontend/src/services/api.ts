import type { Course, CourseDetail, Verse, StudyContent } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = null;
};

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
  login: async (password: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
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

  getById: async (id: number): Promise<CourseDetail> => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`);
    if (!response.ok) throw new Error('Failed to fetch course');
    return response.json();
  },

  create: async (name: string): Promise<Course> => {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to create course');
    return response.json();
  },

  update: async (id: number, name: string): Promise<Course> => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name }),
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
