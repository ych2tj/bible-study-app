import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesAPI } from '../services/api';
import type { Course, CourseDetail } from '../types';
import VerseEditor from './VerseEditor';
import StudyContentEditor from './StudyContentEditor';

export default function CourseEditor() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await coursesAPI.getAll();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    try {
      await coursesAPI.create(newCourseName);
      setNewCourseName('');
      await loadCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const handleSelectCourse = async (courseId: number) => {
    try {
      const courseDetail = await coursesAPI.getById(courseId);
      setSelectedCourse(courseDetail);
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await coursesAPI.delete(courseId);
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
      }
      await loadCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const refreshCourse = async () => {
    if (selectedCourse) {
      await handleSelectCourse(selectedCourse.id);
    }
  };

  const handleBackToCourseList = () => {
    setSelectedCourse(null);
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Course List */}
      {!selectedCourse && (
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">{t('common.appTitle')}</h1>
            <h2 className="text-2xl font-bold mb-4">{t('course.title')}</h2>

            {/* Create Course Form */}
            <form onSubmit={handleCreateCourse} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder={t('course.name')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  {t('course.create')}
                </button>
              </div>
            </form>

            {/* Instruction Text */}
            <p className="text-gray-500 mb-4 text-center">{t('course.selectCourse')}</p>

            {/* Course List */}
            {courses.length === 0 ? (
              <p className="text-gray-500">{t('course.noCourses')}</p>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex justify-between items-center p-3 rounded transition bg-gray-50 hover:bg-gray-100"
                  >
                    <button
                      onClick={() => handleSelectCourse(course.id)}
                      className="flex-1 text-left font-medium"
                    >
                      {course.name}
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course Editor */}
      <div className={selectedCourse ? "lg:col-span-3" : "lg:col-span-2"}>
        {selectedCourse && (
          <div className="space-y-6">
            {/* Back Button and Course Title */}
            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={handleBackToCourseList}
                className="mb-4 px-6 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition flex items-center gap-2 min-w-fit whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                {t('common.back')}
              </button>
              <h1 className="text-3xl font-bold">{selectedCourse.name}</h1>
            </div>

            {/* Verse Editor */}
            <VerseEditor
              courseId={selectedCourse.id}
              verses={selectedCourse.verses}
              onUpdate={refreshCourse}
            />

            {/* Study Content Editor */}
            <StudyContentEditor
              courseId={selectedCourse.id}
              studyContent={selectedCourse.studyContent}
              onUpdate={refreshCourse}
            />
          </div>
        )}
      </div>
    </div>
  );
}
