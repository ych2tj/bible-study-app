import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { studyContentAPI } from '../services/api';
import type { StudyContent } from '../types';
import AlertDialog from './AlertDialog';

interface StudyContentEditorProps {
  courseId: number;
  studyContent: StudyContent;
  onUpdate: () => void;
}

export default function StudyContentEditor({
  courseId,
  studyContent,
  onUpdate,
}: StudyContentEditorProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [references, setReferences] = useState('');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    setContent(studyContent?.content || '');
    setReferences(studyContent?.reference_text || '');
  }, [studyContent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await studyContentAPI.save(courseId, content, references);
      onUpdate();
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t('study.content')}</h2>

      <div className="space-y-6">
        {/* Study Notes Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('study.studyNotes')}</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('study.references')}</label>
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

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? t('common.loading') : t('common.save')}
        </button>
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
