import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesAPI } from '../services/api';
import type { Course, CourseDetail } from '../types';
import VerseEditor from './VerseEditor';
import StudyContentEditor from './StudyContentEditor';
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';

export default function CourseEditor() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesWithDetails, setCoursesWithDetails] = useState<Map<number, number>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'course' | 'verse'>('course');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await coursesAPI.getAll();
      setCourses(data);

      // Load verse counts for each course
      const verseCounts = new Map<number, number>();
      await Promise.all(
        data.map(async (course) => {
          try {
            const detail = await coursesAPI.getById(course.id);
            verseCounts.set(course.id, detail.verses.length);
          } catch (err) {
            verseCounts.set(course.id, 0);
          }
        })
      );
      setCoursesWithDetails(verseCounts);
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

  const confirmDeleteCourse = async () => {
    if (confirmDelete === null) return;

    try {
      await coursesAPI.delete(confirmDelete);
      if (selectedCourse?.id === confirmDelete) {
        setSelectedCourse(null);
      }
      setConfirmDelete(null);
      await loadCourses();
      setAlert({
        title: t('common.success'),
        message: 'Course deleted successfully!',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to delete course:', error);
      setAlert({
        title: t('common.error'),
        message: 'Failed to delete course',
        variant: 'error'
      });
      setConfirmDelete(null);
    }
  };

  const refreshCourse = async () => {
    if (selectedCourse) {
      await handleSelectCourse(selectedCourse.id);
    }
  };

  const handleBackToCourseList = () => {
    setSelectedCourse(null);
    setActiveTab('course');
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div>
      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('course')}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === 'course'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {t('course.courseManagement')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('verse')}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === 'verse'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('course.verseManagement')}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'course' && (
        <div className="px-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">{t('course.courseManagement')}</h2>

            {/* Create New Course Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">{t('course.createNew')}</h3>
              <form onSubmit={handleCreateCourse} className="flex gap-3">
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder={t('course.name')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
                >
                  {t('course.create')}
                </button>
              </form>
            </div>

            {/* Course List */}
            <div>
              {courses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('course.noCourses')}</p>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex justify-between items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
                      onClick={() => {
                        handleSelectCourse(course.id);
                        setActiveTab('verse');
                      }}
                    >
                      <div>
                        <h3 className="font-bold text-lg">{course.name}</h3>
                        <div className="flex gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            {coursesWithDetails.get(course.id) || 0} {t('course.verses')}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(course.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(course.id);
                        }}
                        className="text-red-600 hover:text-red-700 p-2"
                        title={t('common.delete')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verse & Content Management Tab */}
      {activeTab === 'verse' && (
        <div className="px-6">
          {!selectedCourse ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">{t('verse.pleaseSelect')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Course Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <button
                  onClick={handleBackToCourseList}
                  className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {t('common.back')}
                </button>
                <h2 className="text-2xl font-bold">{selectedCourse.name}</h2>
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
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title={t('common.confirmDelete')}
        message={`${t('common.areYouSure')} ${t('common.deleteWarning')}`}
        onConfirm={confirmDeleteCourse}
        onCancel={() => setConfirmDelete(null)}
        variant="danger"
      />

      {/* Alert Dialog */}
      {alert && (
        <AlertDialog
          isOpen={true}
          title={alert.title}
          message={alert.message}
          variant={alert.variant}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
}
