'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useToast, TaskTypeBadge, TaskStatusBadge, PhotoUpload } from '@/components/ui';
import { 
  ArrowLeft, Home, Calendar, MapPin, CheckCircle, Circle,
  Camera, MessageSquare, AlertTriangle, Check, Clock, X
} from 'lucide-react';

interface TaskDetail {
  id: string;
  property_id: string;
  property_name: string;
  property_address: string;
  unit_id: string | null;
  unit_name: string | null;
  task_type: 'turnover' | 'deep_clean' | 'inspection' | 'maintenance';
  status: 'todo' | 'in_progress' | 'done';
  scheduled_date: string;
  checklist: { item: string; completed: boolean }[];
  notes: string | null;
  photos: { id: string; url: string; caption: string }[];
}

export default function CleanerTaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [params.id]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/cleaner/tasks/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setTask(data.data);
        setNotes(data.data.notes || '');
      } else {
        showToast('Task not found', 'error');
        router.push('/cleaner');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      showToast('Failed to load task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklistItem = async (index: number) => {
    if (!task) return;

    const newChecklist = [...task.checklist];
    newChecklist[index].completed = !newChecklist[index].completed;

    // Optimistic update
    setTask({ ...task, checklist: newChecklist });

    try {
      const res = await fetch(`/api/cleaner/tasks/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: newChecklist }),
      });

      if (!res.ok) {
        // Revert on error
        newChecklist[index].completed = !newChecklist[index].completed;
        setTask({ ...task, checklist: newChecklist });
        showToast('Failed to update checklist', 'error');
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const startTask = async () => {
    if (!task || task.status !== 'todo') return;

    setSaving(true);
    try {
      const res = await fetch(`/api/cleaner/tasks/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      const data = await res.json();
      if (data.success) {
        setTask({ ...task, status: 'in_progress' });
        showToast('Task started!', 'success');
      }
    } catch (error) {
      console.error('Error starting task:', error);
      showToast('Failed to start task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const completeTask = async () => {
    if (!task) return;

    // Check requirements
    const incompleteItems = task.checklist.filter(item => !item.completed).length;
    if (incompleteItems > 0) {
      showToast(`Complete all ${incompleteItems} remaining checklist items`, 'error');
      return;
    }

    if (task.photos.length < 8) {
      showToast(`Upload at least ${8 - task.photos.length} more photos`, 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/cleaner/tasks/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done', notes }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Task completed! Great job! 🎉', 'success');
        router.push('/cleaner');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      showToast('Failed to complete task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cleaner/tasks/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.success) {
        setTask({ ...task!, notes });
        setShowNotesModal(false);
        showToast('Notes saved', 'success');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      showToast('Failed to save notes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (!task) return;

    setUploadingPhotos(true);
    try {
      // Convert FileList to base64 strings
      const photos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        photos.push(base64);
      }

      const res = await fetch(`/api/cleaner/tasks/${params.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTask(); // Refresh to get new photos
        showToast('Photos uploaded!', 'success');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      showToast('Failed to upload photos', 'error');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handlePhotoRemove = (index: number) => {
    if (!task || !task.photos[index]) return;
    deletePhoto(task.photos[index].id);
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/cleaner/tasks/${params.id}/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTask({
          ...task!,
          photos: task!.photos.filter(p => p.id !== photoId),
        });
        showToast('Photo deleted', 'success');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const completedItems = task.checklist.filter(item => item.completed).length;
  const totalItems = task.checklist.length;
  const photosNeeded = Math.max(0, 8 - task.photos.length);
  const canComplete = completedItems === totalItems && task.photos.length >= 8;

  return (
    <div className="space-y-6 pb-32 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/cleaner')}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <TaskTypeBadge type={task.task_type} />
            <TaskStatusBadge status={task.status} />
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className="card p-4">
        <h1 className="text-xl font-semibold text-gray-900">
          {task.property_name}
          {task.unit_name && <span className="text-gray-500"> • {task.unit_name}</span>}
        </h1>
        <div className="flex flex-col gap-2 mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            {new Date(task.scheduled_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          {task.property_address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              {task.property_address}
            </div>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium">Checklist</span>
          </div>
          <div className="text-2xl font-bold">
            {completedItems}/{totalItems}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Photos</span>
          </div>
          <div className="text-2xl font-bold">
            {task.photos.length}/8
            {task.photos.length < 8 && (
              <span className="text-sm font-normal text-gray-500 ml-1">min</span>
            )}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (task.photos.length / 8) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Start Task Button */}
      {task.status === 'todo' && (
        <button
          onClick={startTask}
          disabled={saving}
          className="w-full btn-primary py-3 text-lg"
        >
          {saving ? 'Starting...' : 'Start Task'}
        </button>
      )}

      {/* Checklist */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Checklist</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {task.checklist.map((item, index) => (
            <button
              key={index}
              onClick={() => toggleChecklistItem(index)}
              disabled={task.status === 'done'}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {item.completed ? (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
              )}
              <span className={item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                {item.item}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Photos Section */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Photos</h2>
            {photosNeeded > 0 && (
              <span className="text-sm text-orange-600">
                {photosNeeded} more needed
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          {task.status !== 'done' && (
            <PhotoUpload
              photos={task.photos.map(p => p.url)}
              onUpload={handlePhotoUpload}
              onRemove={handlePhotoRemove}
              maxPhotos={12}
              loading={uploadingPhotos}
            />
          )}
          
          {task.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {task.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square group">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Task photo'}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {task.status !== 'done' && (
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowNotesModal(true)}
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-gray-900">Notes & Issues</span>
            </div>
            {task.notes && (
              <span className="text-sm text-brand-600">Edit</span>
            )}
          </div>
          {task.notes ? (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{task.notes}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-400">Add notes or report issues...</p>
          )}
        </button>
      </div>

      {/* Complete Task Button - Fixed at bottom on mobile */}
      {task.status === 'in_progress' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:relative md:border-0 md:p-0 md:bg-transparent">
          {!canComplete && (
            <div className="flex items-center gap-2 text-sm text-orange-600 mb-3">
              <AlertTriangle className="w-4 h-4" />
              <span>
                {completedItems < totalItems && `Complete ${totalItems - completedItems} checklist items. `}
                {task.photos.length < 8 && `Upload ${photosNeeded} more photos.`}
              </span>
            </div>
          )}
          <button
            onClick={completeTask}
            disabled={!canComplete || saving}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50"
          >
            {saving ? 'Completing...' : 'Complete Task'}
          </button>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Notes & Issues</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes, issues found, or special conditions..."
              className="input w-full h-32 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                disabled={saving}
                className="flex-1 btn-primary"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
