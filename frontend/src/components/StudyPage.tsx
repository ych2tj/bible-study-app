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

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Course List */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">{t('course.title')}</h2>
          {courses.length === 0 ? (
            <p className="text-gray-500">{t('course.noCourses')}</p>
          ) : (
            <div className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className={`w-full text-left px-4 py-3 rounded transition ${
                    selectedCourse?.id === course.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {course.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Content */}
      <div className="lg:col-span-2">
        {!selectedCourse ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            {t('course.selectCourse')}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Course Title */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-3xl font-bold">{selectedCourse.name}</h1>
            </div>

            {/* Bible Verses */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">{t('verse.title')}</h3>
              {selectedCourse.verses.length === 0 ? (
                <p className="text-gray-500">No verses added yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedCourse.verses.map((verse) => (
                    <div
                      key={verse.id}
                      onClick={() => handleVerseClick(verse)}
                      className={`p-3 rounded cursor-pointer transition ${
                        selectedVerse?.id === verse.id
                          ? 'bg-blue-100 border-l-4 border-blue-600'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-semibold text-blue-600">
                        {verse.gospel} {verse.chapter}:{verse.verse_number}
                      </span>
                      <span className="ml-2">{verse.content}</span>
                    </div>
                  ))}
                </div>
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
                    <h4 className="font-semibold mb-2">References:</h4>
                    <p className="whitespace-pre-wrap text-gray-700">
                      {selectedCourse.studyContent.reference_text}
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
