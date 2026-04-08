import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { scheduleAPI, coursesAPI } from '../services/api';
import type { Schedule } from '../types';
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';

interface ScheduleManagerProps {
  onCoursesUpdate?: () => Promise<void>;
}

const getLocalizedText = (
  textZh: string | null | undefined,
  textEn: string | null | undefined,
  currentLang: string
): string => {
  if (currentLang === 'en') return textEn || textZh || '';
  return textZh || textEn || '';
};

export const ScheduleManager = ({ onCoursesUpdate }: ScheduleManagerProps) => {
  const { t, i18n } = useTranslation();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    course_date: '',
    course_time: '',
    course_name_zh: '',
    course_name_en: '',
    leader: '',
    visible: 1,
  });
  const [nameLang, setNameLang] = useState<'zh' | 'en'>('zh');

  // Dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; scheduleId: number | null }>({
    isOpen: false,
    scheduleId: null,
  });
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; variant: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleAPI.getAllIncludingHidden();
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      course_date: '',
      course_time: '',
      course_name_zh: '',
      course_name_en: '',
      leader: '',
      visible: 1,
    });
    setNameLang('zh');
    setEditingSchedule(null);
    setShowAddForm(false);
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEditClick = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      course_date: schedule.course_date,
      course_time: schedule.course_time || '',
      course_name_zh: schedule.course_name_zh || '',
      course_name_en: schedule.course_name_en || '',
      leader: schedule.leader || '',
      visible: schedule.visible,
    });
    setNameLang('zh');
    setShowAddForm(false);
  };

  const handleSave = async () => {
    if (!formData.course_date || (!formData.course_name_zh && !formData.course_name_en)) {
      setAlertDialog({
        isOpen: true,
        title: t('common.error'),
        message: 'Date and at least one Course Name (ZH or EN) are required',
        variant: 'error',
      });
      return;
    }

    const courseName = formData.course_name_zh || formData.course_name_en;

    try {
      if (editingSchedule) {
        // Update existing schedule
        await scheduleAPI.update(editingSchedule.id, {
          ...formData,
          course_name: courseName,
          is_manual: editingSchedule.is_manual,
        });

        // If this schedule is linked to a course (auto-populated), sync changes back to the course
        if (editingSchedule.course_id) {
          try {
            await coursesAPI.update(editingSchedule.course_id, {
              name: courseName,
              course_date: formData.course_date,
              course_time: formData.course_time || undefined,
              leader: formData.leader || undefined,
              visible: formData.visible,
            });

            // Refresh the courses list in CourseEditor
            if (onCoursesUpdate) {
              await onCoursesUpdate();
            }
          } catch (courseError) {
            console.warn('Failed to sync changes to course:', courseError);
            // Continue even if course update fails (course might have been deleted)
          }
        }
      } else {
        // Create new schedule
        await scheduleAPI.create({
          ...formData,
          course_name: courseName,
          is_manual: 1,
        });
      }
      await loadSchedules();
      resetForm();
      setAlertDialog({
        isOpen: true,
        title: t('common.success'),
        message: editingSchedule
          ? (editingSchedule.course_id
              ? 'Schedule and linked course updated successfully'
              : 'Schedule updated successfully')
          : 'Schedule created successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to save schedule:', error);
      setAlertDialog({
        isOpen: true,
        title: t('common.error'),
        message: 'Failed to save schedule',
        variant: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.scheduleId) return;

    try {
      await scheduleAPI.delete(deleteDialog.scheduleId);
      await loadSchedules();
      setDeleteDialog({ isOpen: false, scheduleId: null });
      setAlertDialog({
        isOpen: true,
        title: t('common.success'),
        message: 'Schedule deleted successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      setAlertDialog({
        isOpen: true,
        title: t('common.error'),
        message: 'Failed to delete schedule',
        variant: 'error',
      });
    }
  };

  const handleToggleVisibility = async (id: number) => {
    try {
      await scheduleAPI.toggleVisibility(id);
      await loadSchedules();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const handleAutoPopulate = async () => {
    try {
      const result = await scheduleAPI.autoPopulate();
      await loadSchedules();

      const messageParts = [];
      if (result.added > 0) messageParts.push(`Added ${result.added} new`);
      if (result.updated > 0) messageParts.push(`Updated ${result.updated} existing`);

      const message = messageParts.length > 0
        ? `${messageParts.join(', ')} schedule items from courses`
        : 'No courses with dates found';

      setAlertDialog({
        isOpen: true,
        title: t('common.success'),
        message,
        variant: messageParts.length > 0 ? 'success' : 'info',
      });
    } catch (error) {
      console.error('Failed to auto-populate:', error);
      setAlertDialog({
        isOpen: true,
        title: t('common.error'),
        message: 'Failed to auto-populate schedule',
        variant: 'error',
      });
    }
  };

  const sortedSchedules = [...schedules].sort((a, b) => {
    // Sort descending by date (newest first)
    return b.course_date.localeCompare(a.course_date);
  });

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('schedule.management')}</h2>
        <div className="flex gap-3">
          <button
            onClick={handleAutoPopulate}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            title="Add new courses and update existing auto-populated entries from course list"
          >
            {t('schedule.autoPopulate')}
          </button>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {t('schedule.addNew')}
          </button>
        </div>
      </div>

      {/* Add New Form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-3">{t('schedule.addNew')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('schedule.date')} *</label>
              <input
                type="date"
                value={formData.course_date}
                onChange={(e) => setFormData({ ...formData, course_date: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('schedule.time')}</label>
              <input
                type="time"
                value={formData.course_time}
                onChange={(e) => setFormData({ ...formData, course_time: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">{t('schedule.courseName')} *</label>
                <div className="flex rounded overflow-hidden border border-gray-300 text-xs">
                  <button type="button" onClick={() => setNameLang('zh')}
                    className={`px-2 py-1 transition ${nameLang === 'zh' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>ZH</button>
                  <button type="button" onClick={() => setNameLang('en')}
                    className={`px-2 py-1 transition ${nameLang === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>EN</button>
                </div>
              </div>
              {nameLang === 'zh' ? (
                <input type="text" value={formData.course_name_zh}
                  onChange={(e) => setFormData({ ...formData, course_name_zh: e.target.value })}
                  className="w-full px-3 py-2 border rounded" placeholder="中文课程名称" />
              ) : (
                <input type="text" value={formData.course_name_en}
                  onChange={(e) => setFormData({ ...formData, course_name_en: e.target.value })}
                  className="w-full px-3 py-2 border rounded" placeholder="English course name" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('schedule.leader')}</label>
              <input
                type="text"
                value={formData.leader}
                onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.visible === 1}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked ? 1 : 0 })}
                className="mr-2"
              />
              {t('schedule.visible')}
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {t('schedule.save')}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              {t('schedule.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Schedule Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('schedule.date')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('schedule.time')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('schedule.courseName')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('schedule.leader')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSchedules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {t('schedule.noSchedule')}
                </td>
              </tr>
            ) : (
              sortedSchedules.map((schedule) => (
                <>
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{schedule.course_date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{schedule.course_time || '-'}</td>
                    <td className="px-4 py-3">
                      {getLocalizedText(schedule.course_name_zh, schedule.course_name_en, i18n.language) || schedule.course_name}
                    </td>
                    <td className="px-4 py-3">{schedule.leader || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${schedule.is_manual ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {schedule.is_manual ? t('schedule.manualEntry') : t('schedule.autoEntry')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleVisibility(schedule.id)}
                          className={`p-2 rounded transition ${
                            schedule.visible
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title={schedule.visible ? t('schedule.visible') : t('schedule.hidden')}
                        >
                          {schedule.visible ? '👁️' : '🙈'}
                        </button>
                        <button
                          onClick={() => handleEditClick(schedule)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, scheduleId: schedule.id })}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Inline Edit Form */}
                  {editingSchedule?.id === schedule.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 bg-gray-50">
                        <div className="border border-gray-300 rounded-lg p-4 bg-white">
                          <h3 className="text-lg font-semibold mb-3">{t('schedule.edit')}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">{t('schedule.date')} *</label>
                              <input
                                type="date"
                                value={formData.course_date}
                                onChange={(e) => setFormData({ ...formData, course_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">{t('schedule.time')}</label>
                              <input
                                type="time"
                                value={formData.course_time}
                                onChange={(e) => setFormData({ ...formData, course_time: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium">{t('schedule.courseName')} *</label>
                                <div className="flex rounded overflow-hidden border border-gray-300 text-xs">
                                  <button type="button" onClick={() => setNameLang('zh')}
                                    className={`px-2 py-1 transition ${nameLang === 'zh' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>ZH</button>
                                  <button type="button" onClick={() => setNameLang('en')}
                                    className={`px-2 py-1 transition ${nameLang === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>EN</button>
                                </div>
                              </div>
                              {nameLang === 'zh' ? (
                                <input type="text" value={formData.course_name_zh}
                                  onChange={(e) => setFormData({ ...formData, course_name_zh: e.target.value })}
                                  className="w-full px-3 py-2 border rounded" placeholder="中文课程名称" />
                              ) : (
                                <input type="text" value={formData.course_name_en}
                                  onChange={(e) => setFormData({ ...formData, course_name_en: e.target.value })}
                                  className="w-full px-3 py-2 border rounded" placeholder="English course name" />
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">{t('schedule.leader')}</label>
                              <input
                                type="text"
                                value={formData.leader}
                                onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.visible === 1}
                                onChange={(e) => setFormData({ ...formData, visible: e.target.checked ? 1 : 0 })}
                                className="mr-2"
                              />
                              {t('schedule.visible')}
                            </label>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={handleSave}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                              {t('schedule.save')}
                            </button>
                            <button
                              onClick={resetForm}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                            >
                              {t('schedule.cancel')}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={t('common.confirmDelete')}
        message={t('common.deleteWarning')}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, scheduleId: null })}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />
    </div>
  );
};
