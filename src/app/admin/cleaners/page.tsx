'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, Calendar, ClipboardList, Star } from 'lucide-react';
import { DashboardLayout, Modal, LoadingSpinner, EmptyState, Badge, TaskStatusBadge, useToast } from '@/components/ui';
import { User as UserType, Task } from '@/lib/types';
import { format } from 'date-fns';

interface CleanerWithStats extends UserType {
  task_count?: number;
  completed_tasks?: number;
  recent_tasks?: Task[];
}

export default function CleanersPage() {
  const { showToast } = useToast();
  const [cleaners, setCleaners] = useState<CleanerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState<CleanerWithStats | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCleaners();
  }, []);

  const fetchCleaners = async () => {
    try {
      const res = await fetch('/api/admin/users?role=cleaner&include_stats=true');
      if (res.ok) {
        const data = await res.json();
        setCleaners(data.users || []);
      }
    } catch (error) {
      showToast('Failed to load cleaners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCleaner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'cleaner' })
      });
      if (res.ok) {
        showToast('Cleaner added successfully', 'success');
        setShowCreateModal(false);
        setFormData({ name: '', email: '', phone: '' });
        fetchCleaners();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add cleaner', 'error');
      }
    } catch (error) {
      showToast('Failed to add cleaner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fetchCleanerDetails = async (cleanerId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${cleanerId}?include_tasks=true`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCleaner(data.user);
        setShowDetailModal(true);
      }
    } catch (error) {
      showToast('Failed to load cleaner details', 'error');
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cleaners</h1>
            <p className="text-gray-600 mt-1">Manage your cleaning team</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Cleaner
          </button>
        </div>

        {cleaners.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No cleaners yet"
            description="Add your first cleaner to start assigning tasks"
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Cleaner
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cleaners.map((cleaner) => (
              <div
                key={cleaner.id}
                onClick={() => fetchCleanerDetails(cleaner.id)}
                className="card hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-600 font-semibold text-lg">
                      {cleaner.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{cleaner.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{cleaner.email}</span>
                    </div>
                    {cleaner.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Phone className="w-3 h-3" />
                        <span>{cleaner.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <ClipboardList className="w-4 h-4 text-gray-400" />
                      <span>{cleaner.task_count || 0} tasks</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <Star className="w-4 h-4" />
                      <span>{cleaner.completed_tasks || 0} done</span>
                    </div>
                  </div>
                  <Badge variant={cleaner.is_active ? 'success' : 'neutral'}>
                    {cleaner.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Cleaner Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Cleaner">
          <form onSubmit={handleCreateCleaner} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="cleaner@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="+994 50 123 4567"
              />
            </div>
            <p className="text-sm text-gray-500">
              The cleaner will receive a login link via email to access their dashboard.
            </p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Adding...' : 'Add Cleaner'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Cleaner Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedCleaner?.name || 'Cleaner Details'}
        >
          {selectedCleaner && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
                  <span className="text-brand-600 font-semibold text-2xl">
                    {selectedCleaner.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCleaner.name}</h3>
                  <p className="text-gray-500">{selectedCleaner.email}</p>
                  {selectedCleaner.phone && (
                    <p className="text-gray-500">{selectedCleaner.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{selectedCleaner.task_count || 0}</div>
                  <div className="text-sm text-gray-500">Total Tasks</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{selectedCleaner.completed_tasks || 0}</div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
              </div>

              {selectedCleaner.recent_tasks && selectedCleaner.recent_tasks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recent Tasks</h4>
                  <div className="space-y-2">
                    {selectedCleaner.recent_tasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{task.property_name}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(task.scheduled_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <TaskStatusBadge status={task.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 flex gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
