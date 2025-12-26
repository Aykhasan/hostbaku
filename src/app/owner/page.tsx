'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui';
import { 
  Home, Calendar, DollarSign, Wrench, TrendingUp, 
  ChevronRight, FileText, Clock, CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface OwnerStats {
  total_properties: number;
  total_revenue_ytd: number;
  total_expenses_ytd: number;
  net_income_ytd: number;
  occupancy_rate: number;
  upcoming_reservations: number;
  open_maintenance: number;
  pending_statements: number;
}

interface Property {
  id: string;
  name: string;
  address: string;
  current_status: 'occupied' | 'vacant' | 'cleaning';
  next_checkin: string | null;
  occupancy_rate: number;
}

interface Reservation {
  id: string;
  property_name: string;
  unit_name: string | null;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, propsRes, resRes] = await Promise.all([
        fetch('/api/owner/stats'),
        fetch('/api/owner/properties'),
        fetch('/api/owner/reservations?upcoming=true&limit=5'),
      ]);

      const [statsData, propsData, resData] = await Promise.all([
        statsRes.json(),
        propsRes.json(),
        resRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (propsData.success) setProperties(propsData.data);
      if (resData.success) setReservations(resData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's an overview of your properties
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">YTD Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.total_revenue_ytd || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Net Income YTD</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.net_income_ytd || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.occupancy_rate?.toFixed(0) || 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Issues</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.open_maintenance || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Properties */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Your Properties</h2>
            <Link href="/owner/properties" className="text-sm text-brand-600 hover:text-brand-700">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {properties.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No properties found
              </div>
            ) : (
              properties.slice(0, 3).map((property) => (
                <Link
                  key={property.id}
                  href={`/owner/properties/${property.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Home className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{property.name}</h3>
                        <p className="text-sm text-gray-500">{property.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        property.current_status === 'occupied' 
                          ? 'bg-green-100 text-green-700'
                          : property.current_status === 'cleaning'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {property.current_status}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Reservations</h2>
            <span className="text-sm text-gray-500">
              {stats?.upcoming_reservations || 0} upcoming
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {reservations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No upcoming reservations
              </div>
            ) : (
              reservations.map((reservation) => (
                <div key={reservation.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{reservation.guest_name}</h3>
                      <p className="text-sm text-gray-500">
                        {reservation.property_name}
                        {reservation.unit_name && ` • ${reservation.unit_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(reservation.check_in)} - {formatDate(reservation.check_out)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.ceil((new Date(reservation.check_out).getTime() - new Date(reservation.check_in).getTime()) / (1000 * 60 * 60 * 24))} nights
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/owner/statements"
          className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Statements</h3>
            <p className="text-xs text-gray-500">View monthly reports</p>
          </div>
        </Link>

        <Link
          href="/owner/maintenance"
          className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-2 bg-orange-100 rounded-lg">
            <Wrench className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Maintenance</h3>
            <p className="text-xs text-gray-500">
              {stats?.open_maintenance || 0} open tickets
            </p>
          </div>
        </Link>

        <Link
          href="/owner/cleaning-history"
          className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Cleaning History</h3>
            <p className="text-xs text-gray-500">View past cleanings</p>
          </div>
        </Link>

        <Link
          href="/owner/calendar"
          className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-2 bg-purple-100 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Calendar</h3>
            <p className="text-xs text-gray-500">Occupancy overview</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
