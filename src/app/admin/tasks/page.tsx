'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Calendar, User, Building2, Filter, Search, Eye, CheckCircle, Clock } from 'lucide-react';
import { DashboardLayout, Modal, LoadingSpinner, EmptyState, TaskStatusBadge, TaskTypeBadge, useToast } from '@/components/ui';
import { Task, Property, PropertyUnit, User as UserType } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface TaskWithDetails extends Task {
  property_name?: string;
  unit_number?: string;
  cleaner_name?: string;
}

const DEFAULT_CHECKLISTS = {
  turnover: [
    'Strip and remake beds with fresh linens',
    'Replace all towels',
    'Clean and sanitize bathroom',
    'Vacuum and mop floors',
    'Wipe down all surfaces',
    'Clean kitchen and appliances',
    'Take out trash',
    'Check for damages or missing items',
    'Restock supplies (toilet paper, soap, etc.)',
    'Final walkthrough and lock up'
  ],
  deep_clean: [
    'All turnover tasks',
    'Deep clean oven and refrigerator',
    'Clean inside cabinets and drawers',
    'Wash windows inside and out',
    'Clean under furniture',
    'Shampoo carpets/deep clean floors',
    'Clean light fixtures and fans',
    'Sanitize all door handles',
    'Clean AC vents and filters',
    'Deep clean mattresses'
  ],
  inspection: [
    'Check all appliances are working',
    'Test all lights and outlets',
    'Inspect plumbing for leaks',
    'Check HVAC system',
    'Verify WiFi is working',
    'Check smoke detectors',
    'Inspect furniture condition',
    'Document any damages with photos',
    'Verify all supplies are stocked',
    'Check locks and security'
  ],
  maintenance: [
    'Diagnose reported issue',
    'Document current condition',
    'Perform necessary repairs',
    'Test after repair',
    'Clean work area',
    'Update maintenance log',
    'Report any additional issues found'
  ]
};

export default function TasksPage() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [cleaners, setCleaners] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    property_id: '',
    unit_id: '',
    task_type: 'turnover' as 'turnover' | 'deep_clean' | 'inspection' | 'maintenance',
    assigned_to: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchProperties();
    fetchCleaners();
  }, []);

  useEffect(() => {
    if (formData.property_id) {
      fetchUnits(formData.property_id);
    } else {
      setUnits([]);
    }
  }, [formData.property_id]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/admin/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/admin/properties');
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Failed to load properties');
    }
  };

  const fetchUnits = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/units`);
      if (res.ok) {
        const data = await res.json();
        setUnits(data.units || []);
        if (data.units?.length === 1) {
          setFormData(prev => ({ ...prev, unit_id: data.units[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to load units');
    }
  };

  const fetchCleaners = async () => {
    try {
      const res = await fetch('/api/admin/users?role=cleaner');
      if (res.ok) {
        const data = await res.json();
        setCleaners(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load cleaners');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_id) {
      showToast('Please select a unit', 'error');
      return;
    }
    setSaving(true);
    try {
      const taskTypeTitles: Record<string, string> = {
        turnover: 'Turnover Clean',
        deep_clean: 'Deep Clean',
        inspection: 'Inspection',
        maintenance: 'Maintenance'
      };

      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          title: taskTypeTitles[formData.task_type] || 'Task',
          checklist: DEFAULT_CHECKLISTS[formData.task_type].map(item => ({ item, completed: false }))
        })
      });
      if (res.ok) {
        showToast('Task created successfully', 'success');
        setShowCreateModal(false);
        setFormData({
          property_id: '',
          unit_id: '',
          task_type: 'turnover',
          assigned_to: '',
          due_date: format(new Date(), 'yyyy-MM-dd'),
          notes: ''
        });
        fetchTasks();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create task', 'error');
      }
    } catch (error) {
      showToast('Failed to create task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast('Task updated', 'success');
        fetchTasks();
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, status: status as any });
        }
      }
    } catch (error) {
      showToast('Failed to update task', 'error');
    }
  };

  const openTaskDetail = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterType !== 'all' && task.task_type !== filterType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.property_name?.toLowerCase().includes(query) ||
        task.cleaner_name?.toLowerCase().includes(query) ||
        task.unit_number?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-1">Manage cleaning and maintenance tasks</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select w-auto"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select w-auto"
          >
            <option value="all">All Types</option>
            <option value="turnover">Turnover</option>
            <option value="deep_clean">Deep Clean</option>
            <option value="inspection">Inspection</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
            description={tasks.length === 0 ? 'Create your first task to get started' : 'Try adjusting your filters'}
            action={tasks.length === 0 ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            ) : undefined}
          />
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Property</th>
                    <th>Assigned To</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-3">
                          <TaskTypeBadge type={task.task_type} />
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{task.property_name}</div>
                        {task.unit_number && (
                          <div className="text-sm text-gray-500">Unit {task.unit_number}</div>
                        )}
                      </td>
                      <td>
                        {task.cleaner_name || (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {task.due_date ? format(typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date), 'MMM d, yyyy') : 'No date'}
                        </div>
                      </td>
                      <td>
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td>
                        <button
                          onClick={() => openTaskDetail(task)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Task">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select
                required
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value as any })}
                className="select"
              >
                <option value="turnover">Turnover Clean</option>
                <option value="deep_clean">Deep Clean</option>
                <option value="inspection">Inspection</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <select
                required
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: e.target.value, unit_id: '' })}
                className="select"
              >
                <option value="">Select property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {units.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  required
                  value={formData.unit_id}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  className="select"
                >
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.unit_number || 'Main Unit'}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="select"
              >
                <option value="">Unassigned</option>
                {cleaners.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows={3}
                placeholder="Additional instructions..."
              />
            </div>
            <div className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Default Checklist ({formData.task_type.replace('_', ' ')})</h4>
              <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                {DEFAULT_CHECKLISTS[formData.task_type].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand-600">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Task Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Task Details"
        >
          {selectedTask && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TaskTypeBadge type={selectedTask.task_type} />
                <TaskStatusBadge status={selectedTask.status} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Property</label>
                  <p className="font-medium">{selectedTask.property_name}</p>
                  {selectedTask.unit_number && <p className="text-sm text-gray-600">Unit {selectedTask.unit_number}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-500">Scheduled</label>
                  <p className="font-medium">{selectedTask.due_date ? format(typeof selectedTask.due_date === 'string' ? parseISO(selectedTask.due_date) : new Date(selectedTask.due_date), 'MMM d, yyyy') : 'No date'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Assigned To</label>
                  <p className="font-medium">{selectedTask.cleaner_name || 'Unassigned'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Created</label>
                  <p className="font-medium">{format(new Date(selectedTask.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {selectedTask.notes && (
                <div>
                  <label className="text-sm text-gray-500">Notes</label>
                  <p className="mt-1 text-gray-700">{selectedTask.notes}</p>
                </div>
              )}

              {selectedTask.checklist && (
                <div>
                  <label className="text-sm text-gray-500 mb-2 block">Checklist</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(selectedTask.checklist as any[]).map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {item.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                        )}
                        <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                          {item.item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <label className="text-sm text-gray-500 mb-2 block">Update Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateTaskStatus(selectedTask.id, 'todo')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedTask.status === 'todo'
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    To Do
                  </button>
                  <button
                    onClick={() => updateTaskStatus(selectedTask.id, 'in_progress')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedTask.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateTaskStatus(selectedTask.id, 'done')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedTask.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
