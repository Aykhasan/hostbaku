'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Plus, ChevronLeft, ChevronRight, User, DollarSign, Clock } from 'lucide-react';
import { DashboardLayout, Modal, LoadingSpinner, EmptyState, Badge, useToast } from '@/components/ui';
import { Reservation, Property, PropertyUnit } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';

interface ReservationWithDetails extends Reservation {
  property_name?: string;
  unit_number?: string;
}

export default function ReservationsPage() {
  const { showToast } = useToast();
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null);
  const [formData, setFormData] = useState({
    property_id: '',
    unit_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    num_guests: 1,
    total_amount: 0,
    platform: 'airbnb',
    confirmation_code: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReservations();
    fetchProperties();
  }, [currentMonth]);

  useEffect(() => {
    if (formData.property_id) {
      fetchUnits(formData.property_id);
    } else {
      setUnits([]);
    }
  }, [formData.property_id]);

  const fetchReservations = async () => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd');
    try {
      const res = await fetch(`/api/admin/reservations?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
      }
    } catch (error) {
      showToast('Failed to load reservations', 'error');
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

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_id) {
      showToast('Please select a unit', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast('Reservation created successfully', 'success');
        setShowCreateModal(false);
        setFormData({
          property_id: '',
          unit_id: '',
          guest_name: '',
          guest_email: '',
          guest_phone: '',
          check_in: '',
          check_out: '',
          num_guests: 1,
          total_amount: 0,
          platform: 'airbnb',
          confirmation_code: ''
        });
        fetchReservations();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create reservation', 'error');
      }
    } catch (error) {
      showToast('Failed to create reservation', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getReservationsForDay = (date: Date) => {
    return reservations.filter(r => {
      // Handle both Date objects and string dates from API
      const checkIn = typeof r.check_in === 'string' ? parseISO(r.check_in) : new Date(r.check_in);
      const checkOut = typeof r.check_out === 'string' ? parseISO(r.check_out) : new Date(r.check_out);
      return isWithinInterval(date, { start: checkIn, end: checkOut }) || isSameDay(date, checkIn) || isSameDay(date, checkOut);
    });
  };

  const getReservationStyle = (reservation: ReservationWithDetails, date: Date) => {
    const checkIn = parseISO(reservation.check_in);
    const checkOut = parseISO(reservation.check_out);
    const isCheckIn = isSameDay(date, checkIn);
    const isCheckOut = isSameDay(date, checkOut);
    
    if (isCheckIn) return 'bg-green-100 text-green-800 rounded-l-full';
    if (isCheckOut) return 'bg-red-100 text-red-800 rounded-r-full';
    return 'bg-blue-100 text-blue-800';
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayReservations = getReservationsForDay(date);
    if (dayReservations.length === 1) {
      setSelectedReservation(dayReservations[0]);
    } else {
      setSelectedReservation(null);
    }
  };

  const days = getDaysInMonth();
  const startDay = days[0].getDay();

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
            <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
            <p className="text-gray-600 mt-1">View and manage property bookings</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Reservation
          </button>
        </div>

        {/* Calendar */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />
            ))}
            {days.map((date) => {
              const dayReservations = getReservationsForDay(date);
              const isToday = isSameDay(date, new Date());
              return (
                <div
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={`bg-white p-2 min-h-[80px] cursor-pointer hover:bg-gray-50 transition-colors ${
                    isToday ? 'ring-2 ring-brand-500 ring-inset' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-brand-600' : 'text-gray-900'}`}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayReservations.slice(0, 2).map((r) => (
                      <div
                        key={r.id}
                        className={`text-xs px-1.5 py-0.5 truncate ${getReservationStyle(r, date)}`}
                        title={`${r.guest_name} - ${r.property_name}`}
                      >
                        {r.guest_name}
                      </div>
                    ))}
                    {dayReservations.length > 2 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayReservations.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded-l-full" />
              <span>Check-in</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100" />
              <span>Staying</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 rounded-r-full" />
              <span>Check-out</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="card">
            <h3 className="font-semibold mb-4">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            {getReservationsForDay(selectedDate).length === 0 ? (
              <p className="text-gray-500">No reservations on this date</p>
            ) : (
              <div className="space-y-3">
                {getReservationsForDay(selectedDate).map((r) => (
                  <div
                    key={r.id}
                    className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{r.guest_name}</span>
                        {r.platform && (
                          <Badge variant="neutral">{r.platform}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {r.property_name} {r.unit_number && `• Unit ${r.unit_number}`}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(typeof r.check_in === 'string' ? parseISO(r.check_in) : new Date(r.check_in), 'MMM d')} - {format(typeof r.check_out === 'string' ? parseISO(r.check_out) : new Date(r.check_out), 'MMM d')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${r.total_amount}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {isSameDay(parseISO(r.check_in), selectedDate) && (
                        <Badge variant="success">Check-in</Badge>
                      )}
                      {isSameDay(parseISO(r.check_out), selectedDate) && (
                        <Badge variant="danger">Check-out</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Reservation Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Reservation">
          <form onSubmit={handleCreateReservation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
              <input
                type="text"
                required
                value={formData.guest_name}
                onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                className="input"
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  className="input"
                  placeholder="guest@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  className="input"
                  placeholder="+994 50 123 4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                <input
                  type="date"
                  required
                  value={formData.check_in}
                  onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                <input
                  type="date"
                  required
                  value={formData.check_out}
                  onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                <input
                  type="number"
                  min={1}
                  value={formData.num_guests}
                  onChange={(e) => setFormData({ ...formData, num_guests: parseInt(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total ($)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="select"
                >
                  <option value="airbnb">Airbnb</option>
                  <option value="booking">Booking.com</option>
                  <option value="direct">Direct</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Code</label>
              <input
                type="text"
                value={formData.confirmation_code}
                onChange={(e) => setFormData({ ...formData, confirmation_code: e.target.value })}
                className="input"
                placeholder="ABC123"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Creating...' : 'Create Reservation'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
