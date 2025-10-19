import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesAPI } from '../services/api';
import type { Course, CourseDetail, Verse } from '../types';

export default function StudyPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesWithDetails, setCoursesWithDetails] = useState<Map<number, number>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);

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
    setSelectedVerse(verse);
  };

  const handleBackToCourseList = () => {
    setSelectedCourse(null);
    setSelectedVerse(null);
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div>
      {/* Course List */}
      {!selectedCourse && (
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
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
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
                    <p className="text-sm text-gray-500 mb-4">
                      {t('course.createdOn')} {new Date(course.created_at).toLocaleDateString()}
                    </p>
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
              <h1 className="text-3xl font-bold text-gray-800">{selectedCourse.name}</h1>
              <p className="text-gray-500 mt-2">{t('study.content')}</p>
            </div>

            {/* Bible Verses */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">{t('verse.title')}</h2>
              {selectedCourse.verses.length === 0 ? (
                <p className="text-gray-500">{t('verse.noVersesYet')}</p>
              ) : (
                <div className="text-lg leading-relaxed">
                  {selectedCourse.verses.map((verse, index) => (
                    <span key={verse.id}>
                      <span
                        onClick={() => handleVerseClick(verse)}
                        className={`cursor-pointer transition inline-block ${
                          selectedVerse?.id === verse.id
                            ? 'bg-blue-100 px-1 rounded'
                            : 'hover:bg-gray-100 px-1 rounded'
                        }`}
                      >
                        <sup className="font-bold text-blue-600 text-base">
                          {verse.verse_number}
                        </sup>
                        <span className="ml-1">{verse.content}</span>
                      </span>
                      {index < selectedCourse.verses.length - 1 && ' '}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Verse Explanation */}
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
