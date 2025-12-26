'use client';

import { useState, useEffect } from 'react';
import { useAuth, TaskStatusBadge, TaskTypeBadge } from '@/components/ui';
import { 
  CheckCircle, Clock, Home, Calendar, MapPin, 
  ChevronRight, Camera, AlertCircle, ListChecks
} from 'lucide-react';
import Link from 'next/link';

interface Task {
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
  photo_count: number;
}

export default function CleanerDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/cleaner/tasks?filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getChecklistProgress = (checklist: { item: string; completed: boolean }[]) => {
    if (!checklist || checklist.length === 0) return { completed: 0, total: 0 };
    const completed = checklist.filter(item => item.completed).length;
    return { completed, total: checklist.length };
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Hello, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {todoTasks.length + inProgressTasks.length} task{(todoTasks.length + inProgressTasks.length) !== 1 ? 's' : ''} remaining today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{todoTasks.length}</div>
          <div className="text-xs text-gray-500">To Do</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</div>
          <div className="text-xs text-gray-500">In Progress</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{doneTasks.length}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {(['today', 'upcoming', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-500">No tasks scheduled for {filter === 'today' ? 'today' : filter}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* In Progress Tasks First */}
          {inProgressTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                In Progress
              </h2>
              {inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* To Do Tasks */}
          {todoTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                To Do
              </h2>
              {todoTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* Completed Tasks */}
          {doneTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Completed
              </h2>
              {doneTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const progress = getChecklistProgress(task.checklist);
  
  return (
    <Link href={`/cleaner/tasks/${task.id}`}>
      <div className={`card p-4 hover:shadow-md transition-all cursor-pointer ${
        task.status === 'in_progress' ? 'border-l-4 border-l-blue-500' : ''
      } ${task.status === 'done' ? 'opacity-75' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TaskTypeBadge type={task.task_type} />
              <TaskStatusBadge status={task.status} />
            </div>
            
            <h3 className="font-medium text-gray-900 truncate">
              {task.property_name}
              {task.unit_name && <span className="text-gray-500"> • {task.unit_name}</span>}
            </h3>
            
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(task.scheduled_date)}
              </div>
              {task.property_address && (
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{task.property_address}</span>
                </div>
              )}
            </div>

            {/* Progress indicators */}
            <div className="flex items-center gap-4 mt-3">
              {progress.total > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <ListChecks className="w-4 h-4 text-gray-400" />
                  <span className={progress.completed === progress.total ? 'text-green-600' : 'text-gray-600'}>
                    {progress.completed}/{progress.total}
                  </span>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Camera className="w-4 h-4" />
                <span>{task.photo_count}/8</span>
              </div>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

function getChecklistProgress(checklist: { item: string; completed: boolean }[] | null) {
  if (!checklist || checklist.length === 0) return { completed: 0, total: 0 };
  const completed = checklist.filter(item => item.completed).length;
  return { completed, total: checklist.length };
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
