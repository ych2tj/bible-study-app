import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { versesAPI } from '../services/api';
import type { Verse } from '../types';
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';

interface VerseEditorProps {
  courseId: number;
  verses: Verse[];
  courseLanguage?: string;
  onUpdate: () => void;
}

export default function VerseEditor({ courseId, verses, courseLanguage, onUpdate }: VerseEditorProps) {
  const { t, i18n } = useTranslation();
  const langLabel = courseLanguage === 'en' ? t('course.languageEnglish') : t('course.languageChinese');
  const getLocalizedText = (zh: string | null | undefined, en: string | null | undefined): string => {
    if (i18n.language === 'en') return en || zh || '';
    return zh || en || '';
  };
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVerse, setEditingVerse] = useState<Verse | null>(null);
  const [gospel, setGospel] = useState('');
  const [chapter, setChapter] = useState('');
  const [verseNumber, setVerseNumber] = useState('');
  const [content, setContent] = useState('');
  const [explanation, setExplanation] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  const handleEditVerse = (verse: Verse) => {
    setEditingVerse(verse);
    setGospel(verse.gospel);
    setChapter(verse.chapter.toString());
    setVerseNumber(verse.verse_number.toString());
    setContent(verse.content);
    setExplanation(verse.explanation || '');
    setShowAddForm(false); // Don't show the top form when editing inline
  };

  const resetForm = () => {
    setGospel('');
    setChapter('');
    setVerseNumber('');
    setContent('');
    setExplanation('');
    setShowAddForm(false);
    setEditingVerse(null);
  };

  const handleAddVerse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gospel || !chapter || !verseNumber || !content) {
      setAlert({
        title: t('common.error'),
        message: 'Please fill in all required fields',
        variant: 'error'
      });
      return;
    }

    try {
      if (editingVerse) {
        // Update existing verse
        await versesAPI.update(editingVerse.id, {
          gospel,
          chapter: parseInt(chapter),
          verse_number: parseInt(verseNumber),
          content,
          explanation,
        });

        resetForm();
        onUpdate();
        setAlert({
          title: t('common.success'),
          message: 'Verse updated successfully!',
          variant: 'success'
        });
      } else {
        // Create new verse
        await versesAPI.create({
          course_id: courseId,
          gospel,
          chapter: parseInt(chapter),
          verse_number: parseInt(verseNumber),
          content,
          explanation,
          order_index: verses.length,
        });

        resetForm();
        onUpdate();
        setAlert({
          title: t('common.success'),
          message: 'Verse added successfully!',
          variant: 'success'
        });
      }
    } catch (error) {
      console.error('Failed to save verse:', error);
      setAlert({
        title: t('common.error'),
        message: editingVerse ? 'Failed to update verse' : 'Failed to add verse',
        variant: 'error'
      });
    }
  };

  const confirmDeleteVerse = async () => {
    if (confirmDelete === null) return;

    try {
      await versesAPI.delete(confirmDelete);
      setConfirmDelete(null);
      onUpdate();
      setAlert({
        title: t('common.success'),
        message: 'Verse deleted successfully!',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to delete verse:', error);
      setAlert({
        title: t('common.error'),
        message: 'Failed to delete verse',
        variant: 'error'
      });
      setConfirmDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('verse.title')}</h2>
        {!showAddForm && (
          <button
            onClick={() => {
              resetForm(); // Clear any previous edit data
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('verse.addNew')}
          </button>
        )}
      </div>

      {/* Add Verse Form (Top) */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-1">
            {t('verse.addNew')}
          </h3>
          <div className="mb-4 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-amber-800">
              {(() => { const [before, after] = t('course.editLanguageNote', { language: '|||' }).split('|||'); return <>{before}<span className="font-bold">{langLabel}</span>{after}</>; })()}
            </span>
          </div>
          <form onSubmit={handleAddVerse} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('verse.gospel')} *</label>
                <input
                  type="text"
                  value={gospel}
                  onChange={(e) => setGospel(e.target.value)}
                  placeholder="e.g., Matthew"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('verse.chapter')} *</label>
                <input
                  type="number"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('verse.verseNumber')} *</label>
                <input
                  type="number"
                  value={verseNumber}
                  onChange={(e) => setVerseNumber(e.target.value)}
                  placeholder="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('verse.content')} *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('verse.content')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('verse.explanationLabel')}</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder={t('verse.explanation')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium"
              >
                {t('verse.add')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition font-medium"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Verses List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('verse.addedVerses')} ({verses.length})</h3>
        {verses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('verse.noVersesYet')}</p>
        ) : (
          <div className="space-y-4">
            {[...verses].sort((a, b) => {
              // Sort by chapter first, then by verse number
              if (a.chapter !== b.chapter) {
                return a.chapter - b.chapter;
              }
              return a.verse_number - b.verse_number;
            }).map((verse) => (
              <div key={verse.id}>
                <div className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-r-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-blue-600 text-lg">
                      {verse.gospel} {verse.chapter}:{verse.verse_number}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditVerse(verse)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title={t('common.edit')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(verse.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title={t('common.delete')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-800 mb-2">{getLocalizedText(verse.content_zh || verse.content, verse.content_en)}</div>
                  {(verse.explanation_zh || verse.explanation_en || verse.explanation) && (
                    <div className="bg-blue-50 p-3 rounded mt-3 border border-blue-100">
                      <div className="text-sm font-medium text-blue-900 mb-1">{t('verse.explanationLabel')}:</div>
                      <div className="text-sm text-blue-800">{getLocalizedText(verse.explanation_zh || verse.explanation, verse.explanation_en)}</div>
                    </div>
                  )}
                </div>

                {/* Inline Edit Form - Show below this verse when editing */}
                {editingVerse?.id === verse.id && (
                  <div className="mt-4 p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
                    <h3 className="text-lg font-semibold mb-1 text-blue-900">{t('verse.edit')}</h3>
                    <div className="mb-4 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                      <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-amber-800">
                        {(() => { const [before, after] = t('course.editLanguageNote', { language: '|||' }).split('|||'); return <>{before}<span className="font-bold">{langLabel}</span>{after}</>; })()}
                      </span>
                    </div>
                    <form onSubmit={handleAddVerse} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">{t('verse.gospel')} *</label>
                          <input
                            type="text"
                            value={gospel}
                            onChange={(e) => setGospel(e.target.value)}
                            placeholder="e.g., Matthew"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">{t('verse.chapter')} *</label>
                          <input
                            type="number"
                            value={chapter}
                            onChange={(e) => setChapter(e.target.value)}
                            placeholder="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">{t('verse.verseNumber')} *</label>
                          <input
                            type="number"
                            value={verseNumber}
                            onChange={(e) => setVerseNumber(e.target.value)}
                            placeholder="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">{t('verse.content')} *</label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={t('verse.content')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">{t('verse.explanationLabel')}</label>
                        <textarea
                          value={explanation}
                          onChange={(e) => setExplanation(e.target.value)}
                          placeholder={t('verse.explanation')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium"
                        >
                          {t('common.save')}
                        </button>
                        <button
                          type="button"
                          onClick={resetForm}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition font-medium"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title={t('common.confirmDelete')}
        message={`${t('common.areYouSure')} ${t('common.deleteWarning')}`}
        onConfirm={confirmDeleteVerse}
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
