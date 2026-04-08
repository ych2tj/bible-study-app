import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { coursesAPI, translateAPI } from '../services/api';
import type { CourseDetail } from '../types';
import AlertDialog from './AlertDialog';

type TranslationItem = {
  key: string;           // unique key for display
  label: string;         // section label
  originalText: string;  // text to translate
  translatedText: string | null;
  type: 'course_name' | 'verse_content' | 'verse_explanation' | 'study_content' | 'reference_text';
  itemId?: number;       // verse id for verse types
};

export default function TranslationPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [translatingItemKey, setTranslatingItemKey] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const [showTranslateChoice, setShowTranslateChoice] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse(parseInt(courseId));
    }
  }, [courseId]);

  // When UI language changes: update labels only, keep content direction unchanged
  useEffect(() => {
    if (course) {
      const sortedVerses = [...course.verses].sort((a, b) => {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse_number - b.verse_number;
      });
      setItems(prev => prev.map(item => {
        if (item.key === 'course_name') return { ...item, label: t('translation.courseName') };
        if (item.key === 'study_content') return { ...item, label: t('translation.studyContent') };
        if (item.key === 'reference_text') return { ...item, label: t('translation.references') };
        if (item.key.startsWith('verse_content_')) {
          const verse = sortedVerses.find(v => item.key === `verse_content_${v.id}`);
          if (verse) return { ...item, label: `${t('translation.verseContent')} ${verse.gospel} ${verse.chapter}:${verse.verse_number}` };
        }
        if (item.key.startsWith('verse_explanation_')) {
          const verse = sortedVerses.find(v => item.key === `verse_explanation_${v.id}`);
          if (verse) return { ...item, label: `${t('translation.verseExplanation')} ${verse.gospel} ${verse.chapter}:${verse.verse_number}` };
        }
        return item;
      }));
    }
  }, [i18n.language]);

  // Rebuild items when swap is toggled
  useEffect(() => {
    if (course) {
      buildItems(course, swapped);
      setProgress(0);
    }
  }, [swapped]);

  const loadCourse = async (id: number) => {
    try {
      const data = await coursesAPI.getById(id);
      setCourse(data);
      buildItems(data, false);
    } catch (err) {
      console.error('Failed to load course:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildItems = (data: CourseDetail, isSwapped = false) => {
    const baseLang = (data.language || 'zh') as 'zh' | 'en';
    const baseTarget = baseLang === 'zh' ? 'en' : 'zh';
    const lang = isSwapped ? baseTarget : baseLang;
    const targetLang = isSwapped ? baseLang : baseTarget;
    const list: TranslationItem[] = [];

    // Course name
    const originalName = lang === 'zh' ? (data.name_zh || '') : (data.name_en || '');
    const translatedName = targetLang === 'en' ? (data.name_en || null) : (data.name_zh || null);
    list.push({
      key: 'course_name',
      label: t('translation.courseName'),
      originalText: originalName,
      translatedText: translatedName,
      type: 'course_name',
    });

    // Sort verses by chapter then verse_number
    const sortedVerses = [...data.verses].sort((a, b) => {
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse_number - b.verse_number;
    });

    for (const verse of sortedVerses) {
      const originalContent = lang === 'zh' ? (verse.content_zh || '') : (verse.content_en || '');
      const translatedContent = targetLang === 'en' ? (verse.content_en || null) : (verse.content_zh || null);

      // Append reference like (约12:2) to verse content (only if content exists)
      const ref = `(${verse.gospel}${verse.chapter}:${verse.verse_number})`;
      const originalWithRef = originalContent
        ? (originalContent.endsWith(ref) ? originalContent : `${originalContent}${ref}`)
        : '';

      list.push({
        key: `verse_content_${verse.id}`,
        label: `${t('translation.verseContent')} ${verse.gospel} ${verse.chapter}:${verse.verse_number}`,
        originalText: originalWithRef,
        translatedText: translatedContent,
        type: 'verse_content',
        itemId: verse.id,
      });

      if (verse.explanation) {
        const originalExpl = lang === 'zh' ? (verse.explanation_zh || '') : (verse.explanation_en || '');
        const translatedExpl = targetLang === 'en' ? (verse.explanation_en || null) : (verse.explanation_zh || null);
        const flatOriginal = originalExpl.replace(/\n+/g, ' ').trim();

        list.push({
          key: `verse_explanation_${verse.id}`,
          label: `${t('translation.verseExplanation')} ${verse.gospel} ${verse.chapter}:${verse.verse_number}`,
          originalText: flatOriginal,
          translatedText: translatedExpl,
          type: 'verse_explanation',
          itemId: verse.id,
        });
      }
    }

    const sc = data.studyContent;
    if (sc?.content) {
      const originalContent = lang === 'zh' ? (sc.content_zh || '') : (sc.content_en || '');
      const translatedContent = targetLang === 'en' ? (sc.content_en || null) : (sc.content_zh || null);
      const flatOriginal = originalContent.replace(/\n+/g, ' ').trim();

      list.push({
        key: 'study_content',
        label: t('translation.studyContent'),
        originalText: flatOriginal,
        translatedText: translatedContent,
        type: 'study_content',
      });
    }

    if (sc?.reference_text) {
      const originalRef = lang === 'zh' ? (sc.reference_text_zh || '') : (sc.reference_text_en || '');
      const translatedRef = targetLang === 'en' ? (sc.reference_text_en || null) : (sc.reference_text_zh || null);
      const flatOriginal = originalRef.replace(/\n+/g, ' ').trim();

      list.push({
        key: 'reference_text',
        label: t('translation.references'),
        originalText: flatOriginal,
        translatedText: translatedRef,
        type: 'reference_text',
      });
    }

    setItems(list);
  };

  const runTranslation = async (skipTranslated: boolean) => {
    if (!course || !courseId) return;
    setShowTranslateChoice(false);
    setTranslating(true);
    setProgress(0);

    const itemsToTranslate = items.filter(item =>
      item.originalText && (!skipTranslated || !item.translatedText)
    );
    const total = itemsToTranslate.length;

    if (total === 0) {
      setTranslating(false);
      setProgress(100);
      return;
    }

    for (let i = 0; i < itemsToTranslate.length; i++) {
      const item = itemsToTranslate[i];

      try {
        const result = await translateAPI.translate(item.originalText);
        const translatedText = result.translated_paragraph;

        setItems(prev => prev.map(it =>
          it.key === item.key ? { ...it, translatedText } : it
        ));

        setProgress(Math.round(((i + 1) / total) * 100));

        // Rate limit: ~6s delay between calls (10 req/min)
        if (i < itemsToTranslate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 6000));
        }
      } catch (err: any) {
        console.error('Translation error for item', item.key, err);
        setTranslating(false);
        setAlert({
          title: t('translation.errorTitle'),
          message: t('translation.errorMessage'),
          variant: 'error',
        });
        return;
      }
    }

    setTranslating(false);
    setProgress(100);
  };

  const translateSingleItem = async (index: number) => {
    const item = items[index];
    if (!item || translating || translatingItemKey) return;
    setTranslatingItemKey(item.key);
    try {
      const result = await translateAPI.translate(item.originalText);
      setItems(prev => prev.map((it, idx) =>
        idx === index ? { ...it, translatedText: result.translated_paragraph } : it
      ));
    } catch (err) {
      console.error('Translation error for item', item.key, err);
      setAlert({
        title: t('translation.errorTitle'),
        message: t('translation.errorMessage'),
        variant: 'error',
      });
    } finally {
      setTranslatingItemKey(null);
    }
  };

  const handleTranslatedChange = (index: number, value: string) => {
    setItems(prev => prev.map((it, idx) => idx === index ? { ...it, translatedText: value } : it));
  };

  const handleSubmit = async () => {
    if (!courseId || !course) return;
    const courseBaseLang = (course.language || 'zh') as 'zh' | 'en';
    const baseTarget: 'zh' | 'en' = courseBaseLang === 'zh' ? 'en' : 'zh';
    const targetLang: 'zh' | 'en' = swapped ? courseBaseLang : baseTarget;
    setSaving(true);
    try {
      for (const item of items) {
        if (item.translatedText) {
          await translateAPI.saveTranslation(
            parseInt(courseId),
            item.type,
            item.translatedText,
            targetLang,
            item.itemId
          );
        }
      }
      // Reload course so swap rebuilds from fresh DB data
      const freshCourse = await coursesAPI.getById(parseInt(courseId));
      setCourse(freshCourse);
      setAlert({ title: t('common.success'), message: t('translation.saveSuccess'), variant: 'success' });
    } catch (err) {
      console.error('Save error:', err);
      setAlert({ title: t('translation.errorTitle'), message: t('translation.errorMessage'), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  if (!course) {
    return <div className="text-center py-8 text-red-600">Course not found</div>;
  }

  const courseBaseLang = (course.language || 'zh') as 'zh' | 'en';
  const baseTarget = courseBaseLang === 'zh' ? 'en' : 'zh';
  const effectiveSourceLang = swapped ? baseTarget : courseBaseLang;
  const effectiveTargetLang = swapped ? courseBaseLang : baseTarget;
  const sourceLangLabel = effectiveSourceLang === 'zh' ? t('course.languageChinese') : t('course.languageEnglish');
  const targetLangLabel = effectiveTargetLang === 'zh' ? t('course.languageChinese') : t('course.languageEnglish');
  const completed = items.length > 0 && items.every(it => it.translatedText !== null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <button
          onClick={() => navigate('/edit', { state: { returnCourseId: parseInt(courseId!), tab: 'verse' } })}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('translation.backToEdit')}
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{t('translation.translationPage')}</h1>
        <p className="text-gray-500 mt-1">{course.name}</p>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="text-sm text-gray-600">{t('translation.sourceLanguage')}: <span className="font-medium">{sourceLangLabel}</span></span>
          <button
            onClick={() => setSwapped(s => !s)}
            disabled={translating || saving}
            className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('translation.swapLanguages')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {t('translation.swapLanguages')}
          </button>
          <span className="text-sm text-gray-600">{t('translation.targetLanguage')}: <span className="font-medium">{targetLangLabel}</span></span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{t('translation.progress')}</span>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {translating && (
          <p className="text-sm text-blue-600 mt-2 animate-pulse">{t('translation.translating')}</p>
        )}
        {!translating && completed && (
          <p className="text-sm text-green-600 mt-2 font-medium">{t('translation.completed')}</p>
        )}
      </div>

      {/* Side-by-side translation table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        {/* Column Headers */}
        <div className="grid grid-cols-2 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
          <div className="px-6 py-3 font-semibold border-r border-blue-500">
            {t('translation.original')} ({sourceLangLabel})
          </div>
          <div className="px-6 py-3 font-semibold">
            {t('translation.translated')} ({targetLangLabel})
          </div>
        </div>

        {/* Rows */}
        {items.map((item, index) => (
          <div
            key={item.key}
            className={`grid grid-cols-2 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
          >
            {/* Original */}
            <div className="px-6 py-4 border-r border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{item.label}</div>
              {item.originalText
                ? <div className="text-gray-800 text-sm leading-relaxed">{item.originalText}</div>
                : <div className="text-gray-400 text-sm italic">{t('translation.noContent')}</div>
              }
              <button
                onClick={() => translateSingleItem(index)}
                disabled={translating || !!translatingItemKey || !item.originalText}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-base font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {translatingItemKey === item.key ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    {t('translation.translating')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    {t('translation.translateItem')}
                  </>
                )}
              </button>
            </div>
            {/* Translated (editable) */}
            <div className="px-6 py-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{item.label}</div>
              <textarea
                value={item.translatedText ?? ''}
                onChange={e => handleTranslatedChange(index, e.target.value)}
                disabled={translating}
                placeholder={t('translation.translationNotAvailable')}
                rows={3}
                className="w-full text-sm text-gray-800 border border-gray-300 rounded p-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed placeholder-gray-400"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={() => setSwapped(s => !s)}
          disabled={translating || saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {t('translation.swapLanguages')}
        </button>
        <button
          onClick={() => setShowTranslateChoice(true)}
          disabled={translating || items.length === 0}
          className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {translating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              {t('translation.translating')}
            </>
          ) : (
            t('translation.translate')
          )}
        </button>
        <button
          onClick={handleSubmit}
          disabled={translating || saving}
          className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? t('translation.saving') : t('translation.submit')}
        </button>
      </div>

      {/* Bottom shortcut: Back */}
      <div className="flex justify-start items-center mt-2">
        <button
          onClick={() => navigate('/edit', { state: { returnCourseId: parseInt(courseId!), tab: 'verse' } })}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('translation.backToEdit')}
        </button>
      </div>

      {/* Translate Choice Dialog */}
      {showTranslateChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{t('translation.translateChoiceTitle')}</h3>
            <p className="text-sm text-gray-600 mb-6">{t('translation.translateChoiceMessage')}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => runTranslation(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
              >
                {t('translation.translateChoiceUntranslated')}
              </button>
              <button
                onClick={() => runTranslation(false)}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium"
              >
                {t('translation.translateChoiceAll')}
              </button>
              <button
                onClick={() => setShowTranslateChoice(false)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-medium"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

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
