import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { versesAPI } from '../services/api';
import type { Verse } from '../types';

interface VerseEditorProps {
  courseId: number;
  verses: Verse[];
  onUpdate: () => void;
}

export default function VerseEditor({ courseId, verses, onUpdate }: VerseEditorProps) {
  const { t } = useTranslation();
  const [gospel, setGospel] = useState('');
  const [chapter, setChapter] = useState('');
  const [verseNumber, setVerseNumber] = useState('');
  const [content, setContent] = useState('');
  const [explanation, setExplanation] = useState('');

  const handleAddVerse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gospel || !chapter || !verseNumber || !content) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await versesAPI.create({
        course_id: courseId,
        gospel,
        chapter: parseInt(chapter),
        verse_number: parseInt(verseNumber),
        content,
        explanation,
        order_index: verses.length,
      });

      // Reset form
      setGospel('');
      setChapter('');
      setVerseNumber('');
      setContent('');
      setExplanation('');

      onUpdate();
    } catch (error) {
      console.error('Failed to add verse:', error);
      alert('Failed to add verse');
    }
  };

  const handleDeleteVerse = async (verseId: number) => {
    if (!confirm('Are you sure you want to delete this verse?')) return;

    try {
      await versesAPI.delete(verseId);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete verse:', error);
      alert('Failed to delete verse');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">{t('verse.title')}</h3>

      {/* Add Verse Form */}
      <form onSubmit={handleAddVerse} className="mb-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('verse.gospel')} *</label>
            <input
              type="text"
              value={gospel}
              onChange={(e) => setGospel(e.target.value)}
              placeholder="e.g., John"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('verse.chapter')} *</label>
            <input
              type="number"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g., 3"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('verse.verseNumber')} *</label>
            <input
              type="number"
              value={verseNumber}
              onChange={(e) => setVerseNumber(e.target.value)}
              placeholder="e.g., 16"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('verse.content')} *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter verse content..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('verse.explanation')}</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Enter verse explanation..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {t('verse.add')}
        </button>
      </form>

      {/* Verses List */}
      <div className="space-y-2">
        <h4 className="font-semibold mb-2">Added Verses ({verses.length})</h4>
        {verses.length === 0 ? (
          <p className="text-gray-500 text-sm">No verses added yet</p>
        ) : (
          verses.map((verse) => (
            <div
              key={verse.id}
              className="flex justify-between items-start p-3 bg-gray-50 rounded"
            >
              <div className="flex-1">
                <div className="font-semibold text-blue-600 mb-1">
                  {verse.gospel} {verse.chapter}:{verse.verse_number}
                </div>
                <div className="text-sm mb-1">{verse.content}</div>
                {verse.explanation && (
                  <div className="text-sm text-gray-600 italic">
                    Explanation: {verse.explanation}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDeleteVerse(verse.id)}
                className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
              >
                {t('common.delete')}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
