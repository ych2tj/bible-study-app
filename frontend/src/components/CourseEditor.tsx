import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { coursesAPI } from '../services/api';
import type { Course, CourseDetail } from '../types';
import VerseEditor from './VerseEditor';
import StudyContentEditor from './StudyContentEditor';
import { ScheduleManager } from './ScheduleManager';
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';

export default function CourseEditor() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const getLocalizedText = (zh: string | null | undefined, en: string | null | undefined): string => {
    if (i18n.language === 'en') return en || zh || '';
    return zh || en || '';
  };
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesWithDetails, setCoursesWithDetails] = useState<Map<number, number>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDate, setNewCourseDate] = useState('');
  const [newCourseTime, setNewCourseTime] = useState('');
  const [newCourseLeader, setNewCourseLeader] = useState('');
  const [newCourseVisible, setNewCourseVisible] = useState(0);
  const [newCourseLanguage, setNewCourseLanguage] = useState('zh');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'course' | 'verse' | 'schedule'>('course');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  // Auto-select course and tab when returning from TranslationPage
  useEffect(() => {
    const state = location.state as { returnCourseId?: number; tab?: string } | null;
    if (state?.returnCourseId && state?.tab === 'verse') {
      const id = state.returnCourseId;
      coursesAPI.getById(id).then(courseDetail => {
        setSelectedCourse(courseDetail);
        setActiveTab('verse');
      }).catch(err => console.error('Failed to restore course selection:', err));
    }
  }, [location.state]);

  const loadCourses = async () => {
    try {
      const data = await coursesAPI.getAllIncludingHidden();
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
      await coursesAPI.create({
        name: newCourseName,
        course_date: newCourseDate || undefined,
        course_time: newCourseTime || undefined,
        leader: newCourseLeader || undefined,
        visible: newCourseVisible,
        language: newCourseLanguage,
      });
      setNewCourseName('');
      setNewCourseDate('');
      setNewCourseTime('');
      setNewCourseLeader('');
      setNewCourseVisible(0);
      setNewCourseLanguage('zh');
      await loadCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
  };

  const handleSaveCourseEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      await coursesAPI.update(editingCourse.id, {
        name: editingCourse.name,
        course_date: editingCourse.course_date || undefined,
        course_time: editingCourse.course_time || undefined,
        leader: editingCourse.leader || undefined,
        visible: editingCourse.visible,
        language: editingCourse.language || 'zh',
      });
      setEditingCourse(null);
      await loadCourses();
      setAlert({
        title: t('common.success'),
        message: 'Course updated successfully!',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to update course:', error);
      setAlert({
        title: t('common.error'),
        message: 'Failed to update course',
        variant: 'error'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);
  };

  const handleToggleVisibility = async (course: Course) => {
    try {
      const newVisibility = course.visible === 1 ? 0 : 1;
      await coursesAPI.update(course.id, {
        name: course.name,
        course_date: course.course_date,
        course_time: course.course_time,
        leader: course.leader,
        visible: newVisibility,
        language: course.language || 'zh',
      });
      await loadCourses();
      setAlert({
        title: t('common.success'),
        message: newVisibility === 1 ? 'Course is now visible on Study Page' : 'Course is now hidden from Study Page',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      setAlert({
        title: t('common.error'),
        message: 'Failed to update course visibility',
        variant: 'error'
      });
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
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === 'schedule'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('schedule.management')}
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
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder={t('course.name')}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    value={newCourseLeader}
                    onChange={(e) => setNewCourseLeader(e.target.value)}
                    placeholder={t('course.leader')}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={newCourseDate}
                    onChange={(e) => setNewCourseDate(e.target.value)}
                    placeholder={t('course.date')}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={newCourseTime}
                    onChange={(e) => setNewCourseTime(e.target.value)}
                    placeholder={t('course.time')}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newCourseVisible === 1}
                      onChange={(e) => setNewCourseVisible(e.target.checked ? 1 : 0)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{t('course.visible')}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 font-medium">{t('course.language')}:</label>
                    <select
                      value={newCourseLanguage}
                      onChange={(e) => setNewCourseLanguage(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="zh">{t('course.languageChinese')}</option>
                      <option value="en">{t('course.languageEnglish')}</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
                  >
                    {t('course.create')}
                  </button>
                </div>
              </form>
            </div>

            {/* Course List */}
            <div>
              {courses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('course.noCourses')}</p>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course.id}>
                      <div
                        className="flex justify-between items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
                        onClick={() => {
                          handleSelectCourse(course.id);
                          setActiveTab('verse');
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">{getLocalizedText(course.name_zh || course.name, course.name_en)}</h3>
                            {(() => {
                              const showingEn = i18n.language === 'en' && !!course.name_en;
                              return (
                                <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                                  showingEn ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {showingEn ? 'EN' : 'ZH'}
                                </span>
                              );
                            })()}
                            {course.visible === 0 && (
                              <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                                {t('course.hidden')}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                            {course.course_date && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {course.course_date}
                              </span>
                            )}
                            {course.course_time && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {course.course_time}
                              </span>
                            )}
                            {course.leader && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {course.leader}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                              {coursesWithDetails.get(course.id) || 0} {t('course.verses')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(course);
                            }}
                            className={`p-2 ${course.visible === 1 ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                            title={course.visible === 1 ? 'Click to hide from Study Page' : 'Click to show on Study Page'}
                          >
                            {course.visible === 1 ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCourse(course);
                            }}
                            className="text-blue-600 hover:text-blue-700 p-2"
                            title={t('common.edit')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
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
                      </div>

                      {/* Inline Edit Form */}
                      {editingCourse?.id === course.id && (
                        <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-semibold mb-3 text-blue-900">{t('course.editCourseInfo')}</h4>
                          <form onSubmit={handleSaveCourseEdit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                value={editingCourse.name}
                                onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                                placeholder={t('course.name')}
                                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                              <input
                                type="text"
                                value={editingCourse.leader || ''}
                                onChange={(e) => setEditingCourse({ ...editingCourse, leader: e.target.value })}
                                placeholder={t('course.leader')}
                                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="date"
                                value={editingCourse.course_date || ''}
                                onChange={(e) => setEditingCourse({ ...editingCourse, course_date: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="time"
                                value={editingCourse.course_time || ''}
                                onChange={(e) => setEditingCourse({ ...editingCourse, course_time: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editingCourse.visible === 1}
                                    onChange={(e) => setEditingCourse({ ...editingCourse, visible: e.target.checked ? 1 : 0 })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">{t('course.visible')}</span>
                                </label>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-700 font-medium">{t('course.language')}:</span>
                                  <span className="text-sm text-gray-800 font-semibold">
                                    {(editingCourse.language || 'zh') === 'zh' ? t('course.languageChinese') : t('course.languageEnglish')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                                >
                                  {t('common.cancel')}
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                >
                                  {t('common.save')}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      )}
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
                <h2 className="text-2xl font-bold">{getLocalizedText(selectedCourse.name_zh || selectedCourse.name, selectedCourse.name_en)}</h2>
              </div>

              {/* Course Details Editor */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">{t('course.editCourseInfo')}</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await coursesAPI.update(selectedCourse.id, {
                      name: selectedCourse.name,
                      course_date: selectedCourse.course_date || undefined,
                      course_time: selectedCourse.course_time || undefined,
                      leader: selectedCourse.leader || undefined,
                      visible: selectedCourse.visible,
                      language: selectedCourse.language || 'zh',
                    });
                    await refreshCourse();
                    await loadCourses();
                    setAlert({
                      title: t('common.success'),
                      message: 'Course details updated successfully!',
                      variant: 'success'
                    });
                  } catch (error) {
                    console.error('Failed to update course:', error);
                    setAlert({
                      title: t('common.error'),
                      message: 'Failed to update course details',
                      variant: 'error'
                    });
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('course.leader')}
                      </label>
                      <input
                        type="text"
                        value={selectedCourse.leader || ''}
                        onChange={(e) => setSelectedCourse({ ...selectedCourse, leader: e.target.value })}
                        placeholder={t('course.leader')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('course.date')}
                      </label>
                      <input
                        type="date"
                        value={selectedCourse.course_date || ''}
                        onChange={(e) => setSelectedCourse({ ...selectedCourse, course_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('course.time')}
                      </label>
                      <input
                        type="time"
                        value={selectedCourse.course_time || ''}
                        onChange={(e) => setSelectedCourse({ ...selectedCourse, course_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCourse.visible === 1}
                        onChange={(e) => setSelectedCourse({ ...selectedCourse, visible: e.target.checked ? 1 : 0 })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{t('course.visible')}</span>
                    </label>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
                    >
                      {t('common.save')}
                    </button>
                  </div>
                  <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-amber-800">
                      <span className="font-semibold">{t('course.language')}: </span>
                      <span className="font-bold">{selectedCourse.language === 'en' ? t('course.languageEnglish') : t('course.languageChinese')}</span>
                      <span className="ml-2 text-amber-700">— {t('course.languageNote')}</span>
                    </div>
                  </div>
                </form>
              </div>

              {/* Verse Editor */}
              <VerseEditor
                courseId={selectedCourse.id}
                verses={selectedCourse.verses}
                courseLanguage={selectedCourse.language}
                onUpdate={refreshCourse}
              />

              {/* Study Content Editor */}
              <StudyContentEditor
                courseId={selectedCourse.id}
                courseLanguage={selectedCourse.language}
                studyContent={selectedCourse.studyContent}
                onUpdate={refreshCourse}
              />
            </div>
          )}
        </div>
      )}

      {/* Schedule Management Tab */}
      {activeTab === 'schedule' && (
        <ScheduleManager onCoursesUpdate={loadCourses} />
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
