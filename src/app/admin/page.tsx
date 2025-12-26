'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import {
  Home,
  Calendar,
  ClipboardList,
  DollarSign,
  TrendingUp,
  UserPlus,
  ArrowRight,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth, StatCard, LoadingSpinner, TaskStatusBadge, TaskTypeBadge } from '@/components/ui';

interface DashboardStats {
  totalProperties: number;
  activeReservations: number;
  pendingTasks: number;
  monthlyRevenue: number;
  occupancyRate: number;
  newLeads: number;
}

interface UpcomingTask {
  id: string;
  title: string;
  task_type: string;
  status: string;
  due_date: string;
  property_name: string;
  assigned_name: string;
}

interface RecentReservation {
  id: string;
  property_name: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_amount: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<UpcomingTask[]>([]);
  const [reservations, setReservations] = useState<RecentReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, tasksRes, reservationsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/tasks?limit=5&status=todo,in_progress'),
        fetch('/api/admin/reservations?limit=5'),
      ]);

      const statsData = await statsRes.json();
      const tasksData = await tasksRes.json();
      const reservationsData = await reservationsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (tasksData.success) setTasks(tasksData.data);
      if (reservationsData.success) setReservations(reservationsData.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-600">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tasks/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Task
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Properties"
          value={stats?.totalProperties || 0}
          icon={<Home className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          label="Active Bookings"
          value={stats?.activeReservations || 0}
          icon={<Calendar className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Pending Tasks"
          value={stats?.pendingTasks || 0}
          icon={<ClipboardList className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="Monthly Revenue"
          value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          label="Occupancy Rate"
          value={`${stats?.occupancyRate || 0}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="New Leads"
          value={stats?.newLeads || 0}
          icon={<UserPlus className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-900">Reservation Calendar</h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 hover:bg-stone-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-stone-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-stone-200 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="bg-stone-50 p-2 text-center text-xs font-medium text-stone-500"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white p-2 min-h-[60px]" />
            ))}
            {monthDays.map((day) => {
              const hasReservation = reservations.some(
                (r) =>
                  new Date(r.check_in) <= day && new Date(r.check_out) > day
              );
              const isCheckIn = reservations.some((r) =>
                isSameDay(new Date(r.check_in), day)
              );
              const isCheckOut = reservations.some((r) =>
                isSameDay(new Date(r.check_out), day)
              );

              return (
                <div
                  key={day.toISOString()}
                  className={`bg-white p-2 min-h-[60px] ${
                    isToday(day) ? 'ring-2 ring-brand-500 ring-inset' : ''
                  } ${hasReservation ? 'bg-brand-50' : ''}`}
                >
                  <span
                    className={`text-sm ${
                      isToday(day)
                        ? 'font-bold text-brand-600'
                        : 'text-stone-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {isCheckIn && (
                    <div className="mt-1 text-[10px] bg-green-100 text-green-700 px-1 rounded truncate">
                      Check-in
                    </div>
                  )}
                  {isCheckOut && (
                    <div className="mt-1 text-[10px] bg-amber-100 text-amber-700 px-1 rounded truncate">
                      Check-out
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-900">Upcoming Tasks</h2>
            <Link href="/admin/tasks" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-4">No pending tasks</p>
            ) : (
              tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/admin/tasks/${task.id}`}
                  className="block p-3 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 truncate">{task.title}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{task.property_name}</p>
                    </div>
                    <TaskTypeBadge type={task.task_type} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-stone-500">
                      {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No date'}
                    </span>
                    <TaskStatusBadge status={task.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent reservations */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">Recent Reservations</h2>
          <Link href="/admin/reservations" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Guest</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-stone-500 py-8">
                    No reservations found
                  </td>
                </tr>
              ) : (
                reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="font-medium">{reservation.property_name}</td>
                    <td>{reservation.guest_name}</td>
                    <td>{format(new Date(reservation.check_in), 'MMM d, yyyy')}</td>
                    <td>{format(new Date(reservation.check_out), 'MMM d, yyyy')}</td>
                    <td>${reservation.total_amount?.toLocaleString() || '0'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
