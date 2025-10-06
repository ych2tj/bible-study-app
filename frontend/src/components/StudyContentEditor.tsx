import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { studyContentAPI } from '../services/api';
import type { StudyContent } from '../types';

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

  useEffect(() => {
    setContent(studyContent?.content || '');
    setReferences(studyContent?.reference_text || '');
  }, [studyContent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await studyContentAPI.save(courseId, content, references);
      alert('Study content saved successfully!');
      onUpdate();
    } catch (error) {
      console.error('Failed to save study content:', error);
      alert('Failed to save study content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">{t('study.content')}</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Study Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter study content and notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">References</label>
          <textarea
            value={references}
            onChange={(e) => setReferences(e.target.value)}
            placeholder="Enter references and resources..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
        >
          {saving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </div>
  );
}
