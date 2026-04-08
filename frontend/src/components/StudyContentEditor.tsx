import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { studyContentAPI, translateAPI } from '../services/api';
import type { StudyContent } from '../types';
import AlertDialog from './AlertDialog';

interface StudyContentEditorProps {
  courseId: number;
  courseLanguage?: string;
  studyContent: StudyContent;
  onUpdate: () => void;
}

export default function StudyContentEditor({
  courseId,
  courseLanguage,
  studyContent,
  onUpdate,
}: StudyContentEditorProps) {
  const { t, i18n } = useTranslation();
  const langLabel = courseLanguage === 'en' ? t('course.languageEnglish') : t('course.languageChinese');
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [references, setReferences] = useState('');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (i18n.language === 'en') {
      setContent(studyContent?.content_en || studyContent?.content || '');
    } else {
      setContent(studyContent?.content_zh || studyContent?.content || '');
    }
    if (i18n.language === 'en') {
      setReferences(studyContent?.reference_text_en || studyContent?.reference_text || '');
    } else {
      setReferences(studyContent?.reference_text_zh || studyContent?.reference_text || '');
    }
  }, [studyContent, i18n.language]);

  const handleSave = async () => {
    setSaving(true);
    const showingEnglish = i18n.language === 'en' && (!!studyContent?.content_en || !!studyContent?.reference_text_en);
    try {
      if (showingEnglish) {
        await translateAPI.saveTranslation(courseId, 'study_content', content, 'en');
        await translateAPI.saveTranslation(courseId, 'reference_text', references, 'en');
        onUpdate();
      } else {
        await studyContentAPI.save(courseId, content, references);
        onUpdate();
      }
      setAlert({
        title: t('common.success'),
        message: 'Study content saved successfully!',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to save study content:', error);
      setAlert({
        title: t('common.error'),
        message: 'Failed to save study content',
        variant: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const langNoteBanner = (
    <div className="mb-2 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
      <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm text-amber-800">
        {(() => { const [before, after] = t('course.editLanguageNote', { language: '|||' }).split('|||'); return <>{before}<span className="font-bold">{langLabel}</span>{after}</>; })()}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t('study.content')}</h2>

      <div className="space-y-6">
        {/* Study Notes Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('study.studyNotes')}</label>
          {langNoteBanner}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('study.studyContent')}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={10}
          />
          <p className="text-xs text-gray-500 mt-2">
            Use line breaks to separate paragraphs. You can include bullet points with • or numbered lists.
          </p>
        </div>

        {/* References Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('study.references')}</label>
          {langNoteBanner}
          <textarea
            value={references}
            onChange={(e) => setReferences(e.target.value)}
            placeholder="URL - Title (one per line)"
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={6}
          />
          <p className="text-xs text-gray-500 mt-2">
            Format: URL - Title (one per line)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate(`/translation/${courseId}`, { state: { displayLang: i18n.language } })}
            disabled={saving}
            className="flex-1 bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('translation.editTranslation')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>

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
