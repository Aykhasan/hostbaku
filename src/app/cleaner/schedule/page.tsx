'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  task_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string | null;
  property_name: string;
  unit_name: string;
  address: string;
}

export default function CleanerSchedulePage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/cleaner/tasks?filter=all');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentDate);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return tasks.filter(t => t.scheduled_date === dateStr);
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'turnover': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'deep_clean': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'inspection': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'maintenance': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'done') return <CheckCircle2 className="w-3 h-3 text-green-600" />;
    return null;
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-600">
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="btn-secondary text-sm">
            Today
          </button>
          <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile View - List */}
      <div className="md:hidden space-y-4">
        {weekDates.map((date, index) => {
          const dateTasks = getTasksForDate(date);
          return (
            <div key={index} className={`card ${isToday(date) ? 'ring-2 ring-brand-500' : ''}`}>
              <div className={`flex items-center gap-3 pb-3 border-b ${isToday(date) ? 'text-brand-600' : ''}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${isToday(date) ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}>
                  {date.getDate()}
                </div>
                <div>
                  <div className="font-medium">{dayNames[index]}</div>
                  <div className="text-xs text-gray-500">{dateTasks.length} task{dateTasks.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              {dateTasks.length === 0 ? (
                <p className="text-sm text-gray-400 py-3">No tasks scheduled</p>
              ) : (
                <div className="space-y-2 pt-3">
                  {dateTasks.map(task => (
                    <Link
                      key={task.id}
                      href={`/cleaner/tasks/${task.id}`}
                      className={`block p-3 rounded-lg border ${getTaskTypeColor(task.task_type)} ${task.status === 'done' ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm capitalize">
                              {task.task_type.replace('_', ' ')}
                            </span>
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="text-xs mt-1 opacity-80">
                            {task.property_name} - {task.unit_name}
                          </div>
                        </div>
                        {task.scheduled_time && (
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            {task.scheduled_time}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop View - Grid */}
      <div className="hidden md:block card overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {weekDates.map((date, index) => (
            <div
              key={index}
              className={`p-3 text-center border-r last:border-r-0 ${isToday(date) ? 'bg-brand-50' : ''}`}
            >
              <div className="text-xs text-gray-500 uppercase">{dayNames[index]}</div>
              <div className={`text-lg font-bold mt-1 ${isToday(date) ? 'text-brand-600' : ''}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDates.map((date, index) => {
            const dateTasks = getTasksForDate(date);
            return (
              <div
                key={index}
                className={`p-2 border-r last:border-r-0 ${isToday(date) ? 'bg-brand-50/30' : ''}`}
              >
                {dateTasks.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center mt-4">No tasks</p>
                ) : (
                  <div className="space-y-2">
                    {dateTasks.map(task => (
                      <Link
                        key={task.id}
                        href={`/cleaner/tasks/${task.id}`}
                        className={`block p-2 rounded border text-xs ${getTaskTypeColor(task.task_type)} hover:shadow-md transition-shadow ${task.status === 'done' ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-medium capitalize truncate">
                            {task.task_type.replace('_', ' ')}
                          </span>
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="truncate opacity-80">{task.unit_name}</div>
                        {task.scheduled_time && (
                          <div className="flex items-center gap-1 mt-1 opacity-70">
                            <Clock className="w-3 h-3" />
                            {task.scheduled_time}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Task Types</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-sm text-gray-600">Turnover</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-sm text-gray-600">Deep Clean</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-sm text-gray-600">Inspection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-orange-500" />
            <span className="text-sm text-gray-600">Maintenance</span>
          </div>
        </div>
      </div>
    </div>
  );
}
