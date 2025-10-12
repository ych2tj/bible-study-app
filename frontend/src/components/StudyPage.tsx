import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { coursesAPI } from '../services/api';
import type { Course, CourseDetail, Verse } from '../types';

export default function StudyPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Course List */}
      {!selectedCourse && (
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">{t('common.appTitle')}</h1>
            <h2 className="text-2xl font-bold mb-4">{t('course.title')}</h2>

            {/* Instruction Text */}
            <p className="text-gray-500 mb-4 text-center">{t('course.selectCourse')}</p>

            {courses.length === 0 ? (
              <p className="text-gray-500 text-center">{t('course.noCourses')}</p>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseClick(course.id)}
                    className="w-full text-left px-4 py-3 rounded transition bg-gray-100 hover:bg-gray-200"
                  >
                    {course.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course Content */}
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

            {/* Bible Verses */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">{t('verse.title')}</h3>
              {selectedCourse.verses.length === 0 ? (
                <p className="text-gray-500">No verses added yet</p>
              ) : (
                <p className="leading-relaxed">
                  {selectedCourse.verses.map((verse, index) => (
                    <span key={verse.id}>
                      <span
                        onClick={() => handleVerseClick(verse)}
                        className={`cursor-pointer transition ${
                          selectedVerse?.id === verse.id
                            ? 'bg-blue-100 px-1 rounded'
                            : 'hover:bg-gray-100 px-1 rounded'
                        }`}
                      >
                        <span className="font-semibold text-blue-600">
                          {verse.verse_number}
                        </span>
                        <span className="ml-1">{verse.content}</span>
                      </span>
                      {index < selectedCourse.verses.length - 1 && ' '}
                    </span>
                  ))}
                </p>
              )}
            </div>

            {/* Verses Explanation */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">{t('study.versesExplanation')}</h3>
              {selectedVerse ? (
                <div>
                  <div className="mb-2 text-blue-600 font-semibold">
                    {selectedVerse.gospel} {selectedVerse.chapter}:{selectedVerse.verse_number}
                  </div>
                  <p className="whitespace-pre-wrap">{selectedVerse.explanation || t('study.clickVerse')}</p>
                </div>
              ) : (
                <p className="text-gray-500">{t('study.clickVerse')}</p>
              )}
            </div>

            {/* Study Content/References */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">{t('study.content')}</h3>
              <div className="space-y-4">
                {selectedCourse.studyContent?.content && (
                  <div>
                    <p className="whitespace-pre-wrap">{selectedCourse.studyContent.content}</p>
                  </div>
                )}
                {selectedCourse.studyContent?.reference_text && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('study.references')}:</h4>
                    <p className="whitespace-pre-wrap text-gray-700">
                      {renderTextWithLinks(selectedCourse.studyContent.reference_text)}
                    </p>
                  </div>
                )}
                {!selectedCourse.studyContent?.content && !selectedCourse.studyContent?.reference_text && (
                  <p className="text-gray-500">No study content added yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
