import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesAPI } from '../services/api';
import type { Course, CourseDetail, Verse } from '../types';
import { ScheduleView } from './ScheduleView';

export default function StudyPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesWithDetails, setCoursesWithDetails] = useState<Map<number, number>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'schedule'>('courses');
  const [versesCardHeight, setVersesCardHeight] = useState(384); // Default 384px (max-h-96)
  const [isResizing, setIsResizing] = useState(false);
  const [viewMode, setViewMode] = useState<'pc' | 'mobile'>(() => {
    // Load from localStorage, default to 'pc'
    const saved = localStorage.getItem('studyPageViewMode');
    return (saved === 'mobile' || saved === 'pc') ? saved : 'pc';
  });
  const [inlineExpandedVerseId, setInlineExpandedVerseId] = useState<number | null>(null);

  // Helper function to convert URLs in text to clickable links
  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Save view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('studyPageViewMode', viewMode);
  }, [viewMode]);

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

  const handleCourseClick = async (courseId: number) => {
    try {
      const courseDetail = await coursesAPI.getById(courseId);
      setSelectedCourse(courseDetail);
      setSelectedVerse(null);
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  };

  const handleVerseClick = (verse: Verse) => {
    if (viewMode === 'pc') {
      // PC mode: update selectedVerse for separate card
      setSelectedVerse(verse);
    } else {
      // Mobile mode: toggle inline explanation
      if (inlineExpandedVerseId === verse.id) {
        // Clicking same verse - hide explanation
        setInlineExpandedVerseId(null);
      } else {
        // Clicking different verse - close previous and open new
        setInlineExpandedVerseId(verse.id);
      }
    }
  };

  const handleBackToCourseList = () => {
    setSelectedCourse(null);
    setSelectedVerse(null);
    setInlineExpandedVerseId(null);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'pc' ? 'mobile' : 'pc');
    setInlineExpandedVerseId(null); // Reset expanded verse when switching modes
    if (viewMode === 'mobile') {
      // Switching to PC mode, clear inline expansion
      setSelectedVerse(null);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Get the verses card element
      const versesCard = document.getElementById('verses-card-content');
      if (!versesCard) return;

      // Calculate new height based on mouse position
      const rect = versesCard.getBoundingClientRect();
      const newHeight = e.clientY - rect.top;

      // Set minimum height of 200px and maximum of 800px
      if (newHeight >= 200 && newHeight <= 800) {
        setVersesCardHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div>
      {/* Only show tabs when not viewing a specific course */}
      {!selectedCourse && (
        <div className="mb-8">
          {/* Tabs */}
          <div className="flex justify-center border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-8 font-medium border-b-2 transition ${
                activeTab === 'courses'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {t('nav.courses')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 px-8 font-medium border-b-2 transition ${
                activeTab === 'schedule'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('schedule.title')}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Course List */}
      {!selectedCourse && activeTab === 'courses' && (
        <div>
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">{t('course.pageTitle')}</h1>
            <p className="text-lg text-gray-600">{t('course.studyJourney')}</p>
          </div>

          {/* Course Grid */}
          {courses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">{t('course.noCourses')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Card Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-900 to-blue-700">
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-50"
                      style={{
                        backgroundImage: 'url(/images/biblecourse.jpg)'
                      }}
                    ></div>
                    <div className="relative h-full flex items-center justify-center p-6">
                      <h3 className="text-2xl font-bold text-white text-center drop-shadow-lg">
                        {course.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {coursesWithDetails.get(course.id) || 0} {t('course.verses')}
                      </span>
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
                    </div>
                    <button
                      onClick={() => handleCourseClick(course.id)}
                      className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition font-medium"
                    >
                      {t('course.startCourse')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule View */}
      {!selectedCourse && activeTab === 'schedule' && (
        <ScheduleView />
      )}

      {/* Course Content */}
      {selectedCourse && (
        <div className="max-w-5xl mx-auto">
          <div className="space-y-6">
            {/* Header with Back Button and Course Title */}
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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{selectedCourse.name}</h1>
                  <p className="text-gray-500 mt-2">{t('study.content')}</p>
                </div>
                {/* PC/Mobile Mode Toggle Button */}
                <button
                  onClick={toggleViewMode}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition border border-blue-200"
                  title={viewMode === 'pc' ? t('study.switchToMobile') : t('study.switchToPC')}
                >
                  {viewMode === 'pc' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{t('study.pcMode')}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{t('study.mobileMode')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bible Verses */}
            <div className="bg-white rounded-lg shadow p-6 relative">
              <h2 className="text-2xl font-bold mb-4">{t('verse.title')}</h2>
              <div
                id="verses-card-content"
                className={viewMode === 'pc' ? 'overflow-y-auto pr-2' : ''}
                style={viewMode === 'pc' ? { height: `${versesCardHeight}px` } : {}}
              >
                {selectedCourse.verses.length === 0 ? (
                  <p className="text-gray-500">{t('verse.noVersesYet')}</p>
                ) : (
                  <p className="text-lg leading-relaxed">
                    {(() => {
                      const sortedVerses = [...selectedCourse.verses].sort((a, b) => {
                        // Sort by chapter first, then by verse number
                        if (a.chapter !== b.chapter) {
                          return a.chapter - b.chapter;
                        }
                        return a.verse_number - b.verse_number;
                      });
                      return sortedVerses.map((verse, index) => (
                        <span key={verse.id}>
                          <span
                            onClick={() => handleVerseClick(verse)}
                            className={`cursor-pointer transition ${
                              viewMode === 'pc' && selectedVerse?.id === verse.id
                                ? 'bg-blue-100 px-1 rounded'
                                : viewMode === 'mobile' && inlineExpandedVerseId === verse.id
                                ? 'bg-blue-100 px-1 rounded'
                                : 'hover:bg-gray-100 px-1 rounded'
                            }`}
                          >
                            <sup className="font-bold text-blue-600 text-base">
                              {verse.verse_number}
                            </sup>
                            {verse.content}
                          </span>
                          {/* Inline Explanation (Mobile Mode Only) */}
                          {viewMode === 'mobile' && inlineExpandedVerseId === verse.id && verse.explanation && (
                            <span className="block my-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <div className="font-bold text-blue-700 mb-2">
                                {verse.gospel} {verse.chapter}:{verse.verse_number}
                              </div>
                              <div className="text-gray-700 whitespace-pre-wrap">
                                {verse.explanation}
                              </div>
                            </span>
                          )}
                          {index < sortedVerses.length - 1 && ' '}
                        </span>
                      ));
                    })()}
                  </p>
                )}
              </div>
              {/* Resize Handle (PC Mode Only) */}
              {viewMode === 'pc' && (
                <div
                  onMouseDown={handleResizeStart}
                  className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-200 transition ${
                    isResizing ? 'bg-blue-300' : ''
                  }`}
                  title="Drag to resize"
                >
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-400 rounded"></div>
                </div>
              )}
            </div>

            {/* Verse Explanation (PC Mode Only) */}
            {viewMode === 'pc' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">{t('study.versesExplanation')}</h2>
                {selectedVerse ? (
                  <div>
                    <div className="mb-3 text-blue-600 font-bold text-lg">
                      {selectedVerse.gospel} {selectedVerse.chapter}:{selectedVerse.verse_number}
                    </div>
                    <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {selectedVerse.explanation || t('study.clickVerse')}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">{t('study.clickVerse')}</p>
                )}
              </div>
            )}

            {/* Study Notes */}
            {selectedCourse.studyContent?.content && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">{t('study.studyNotes')}</h2>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedCourse.studyContent.content}
                </div>
              </div>
            )}

            {/* References - At Bottom */}
            {selectedCourse.studyContent?.reference_text && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">{t('study.references')}</h2>
                <div className="space-y-2">
                  <p className="font-medium text-gray-700">{t('study.additionalResources')}</p>
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {renderTextWithLinks(selectedCourse.studyContent.reference_text)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
