'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, Moon } from 'lucide-react';

interface Reservation {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  property_name: string;
  unit_name: string;
}

export default function OwnerCalendarPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchReservations();
  }, [currentDate]);

  const fetchReservations = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    try {
      const res = await fetch(`/api/owner/reservations?start_date=${startDate}&end_date=${endDate}`);
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = (firstDay.getDay() + 6) % 7; // Monday = 0
    
    const days = [];
    
    // Previous month padding
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getReservationsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return reservations.filter(r => {
      return dateStr >= r.check_in && dateStr < r.check_out;
    });
  };

  const isCheckIn = (date: Date, reservation: Reservation) => {
    return formatDate(date) === reservation.check_in;
  };

  const isCheckOut = (date: Date, reservation: Reservation) => {
    return formatDate(date) === reservation.check_out;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const days = getDaysInMonth(currentDate);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get unique colors for different units
  const unitColors: { [key: string]: string } = {};
  const colorPalette = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  reservations.forEach((r, i) => {
    if (!unitColors[r.unit_name]) {
      unitColors[r.unit_name] = colorPalette[Object.keys(unitColors).length % colorPalette.length];
    }
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Reservation Calendar</h1>
          <p className="text-gray-600">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="btn-secondary text-sm">
            Today
          </button>
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600">This Month</div>
          <div className="text-2xl font-bold text-gray-900">{reservations.length}</div>
          <div className="text-xs text-gray-500">reservations</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Total Nights</div>
          <div className="text-2xl font-bold text-gray-900">
            {reservations.reduce((sum, r) => {
              const nights = Math.ceil((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / (1000 * 60 * 60 * 24));
              return sum + nights;
            }, 0)}
          </div>
          <div className="text-xs text-gray-500">booked</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Revenue</div>
          <div className="text-2xl font-bold text-green-600">
            ${reservations.reduce((sum, r) => sum + r.total_amount, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">this month</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Avg. Rate</div>
          <div className="text-2xl font-bold text-gray-900">
            ${reservations.length > 0 
              ? Math.round(reservations.reduce((sum, r) => sum + r.total_amount, 0) / 
                  reservations.reduce((sum, r) => {
                    const nights = Math.ceil((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / (1000 * 60 * 60 * 24));
                    return sum + nights;
                  }, 0) || 1)
              : 0}
          </div>
          <div className="text-xs text-gray-500">per night</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayReservations = getReservationsForDate(day.date);
            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border-b border-r ${
                  !day.isCurrentMonth ? 'bg-gray-50' : ''
                } ${isToday(day.date) ? 'bg-brand-50' : ''}`}
              >
                <div className={`text-sm mb-1 ${
                  !day.isCurrentMonth ? 'text-gray-400' : 
                  isToday(day.date) ? 'font-bold text-brand-600' : 'text-gray-900'
                }`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayReservations.slice(0, 3).map(res => (
                    <div
                      key={res.id}
                      className={`text-xs p-1 rounded text-white truncate ${unitColors[res.unit_name]}`}
                      title={`${res.guest_name} - ${res.unit_name}`}
                    >
                      {isCheckIn(day.date, res) && '→ '}
                      {res.guest_name.split(' ')[0]}
                    </div>
                  ))}
                  {dayReservations.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayReservations.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {Object.keys(unitColors).length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Units</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(unitColors).map(([unit, color]) => (
              <div key={unit} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded ${color}`} />
                <span className="text-sm text-gray-600">{unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reservations List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month's Reservations</h3>
        {reservations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reservations this month</p>
        ) : (
          <div className="space-y-3">
            {reservations.map(res => (
              <div key={res.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded ${unitColors[res.unit_name]}`} />
                  <div>
                    <div className="font-medium text-gray-900">{res.guest_name}</div>
                    <div className="text-sm text-gray-600">
                      {res.property_name} - {res.unit_name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(res.check_in).toLocaleDateString()} - {new Date(res.check_out).toLocaleDateString()}
                  </div>
                  <div className="text-lg font-bold text-green-600">${res.total_amount}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
