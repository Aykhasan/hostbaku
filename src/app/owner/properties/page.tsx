'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui';
import { Building2, MapPin, Bed, Calendar, DollarSign, TrendingUp, Eye } from 'lucide-react';
import Link from 'next/link';

interface Property {
  id: string;
  name: string;
  address: string;
  units: {
    id: string;
    name: string;
    bedrooms: number;
    bathrooms: number;
  }[];
  stats: {
    total_revenue: number;
    occupancy_rate: number;
    upcoming_reservations: number;
    pending_maintenance: number;
  };
}

export default function OwnerPropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/owner/properties');
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
        <p className="text-gray-600">View and monitor all your managed properties</p>
      </div>

      {properties.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Yet</h3>
          <p className="text-gray-600">
            You don't have any properties assigned to your account yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {properties.map(property => (
            <div key={property.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Property Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{property.name}</h2>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{property.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Units */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Units ({property.units.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.units.map(unit => (
                        <div
                          key={unit.id}
                          className="px-3 py-2 bg-gray-50 rounded-lg border text-sm"
                        >
                          <span className="font-medium">{unit.name}</span>
                          <span className="text-gray-500 ml-2">
                            {unit.bedrooms}BR / {unit.bathrooms}BA
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 lg:w-80">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <DollarSign className="w-4 h-4" />
                      <span>Revenue (YTD)</span>
                    </div>
                    <div className="text-xl font-bold text-green-700 mt-1">
                      ${property.stats.total_revenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>Occupancy</span>
                    </div>
                    <div className="text-xl font-bold text-blue-700 mt-1">
                      {property.stats.occupancy_rate}%
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-purple-600 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Upcoming</span>
                    </div>
                    <div className="text-xl font-bold text-purple-700 mt-1">
                      {property.stats.upcoming_reservations}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                      <Eye className="w-4 h-4" />
                      <span>Maintenance</span>
                    </div>
                    <div className="text-xl font-bold text-orange-700 mt-1">
                      {property.stats.pending_maintenance}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t flex flex-wrap gap-3">
                <Link href="/owner/statements" className="btn-secondary text-sm">
                  View Statements
                </Link>
                <Link href="/owner/maintenance" className="btn-secondary text-sm">
                  Maintenance Tickets
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
