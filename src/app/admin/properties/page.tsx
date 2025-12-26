'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, MapPin, User, Home, Edit, Trash2, Eye } from 'lucide-react';
import { DashboardLayout, Modal, LoadingSpinner, EmptyState, Badge, useToast } from '@/components/ui';
import { Property, PropertyUnit, User as UserType } from '@/lib/types';

interface PropertyWithDetails extends Property {
  owner_name?: string;
  owner_email?: string;
  unit_count?: number;
  units?: PropertyUnit[];
}

export default function PropertiesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [properties, setProperties] = useState<PropertyWithDetails[]>([]);
  const [owners, setOwners] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithDetails | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    owner_id: '',
    notes: ''
  });
  const [unitForm, setUnitForm] = useState({
    unit_number: '',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    cleaning_fee: 50
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchOwners();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/admin/properties');
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      showToast('Failed to load properties', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await fetch('/api/admin/users?role=owner');
      if (res.ok) {
        const data = await res.json();
        setOwners(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load owners');
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast('Property created successfully', 'success');
        setShowCreateModal(false);
        setFormData({ name: '', address: '', owner_id: '', notes: '' });
        fetchProperties();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create property', 'error');
      }
    } catch (error) {
      showToast('Failed to create property', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/properties/${selectedProperty.id}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitForm)
      });
      if (res.ok) {
        showToast('Unit added successfully', 'success');
        setUnitForm({ unit_number: '', bedrooms: 1, bathrooms: 1, max_guests: 2, cleaning_fee: 50 });
        fetchPropertyDetails(selectedProperty.id);
        fetchProperties();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add unit', 'error');
      }
    } catch (error) {
      showToast('Failed to add unit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fetchPropertyDetails = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProperty(data.property);
      }
    } catch (error) {
      console.error('Failed to load property details');
    }
  };

  const openUnitsModal = (property: PropertyWithDetails) => {
    setSelectedProperty(property);
    fetchPropertyDetails(property.id);
    setShowUnitsModal(true);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Property deleted', 'success');
        fetchProperties();
      } else {
        showToast('Failed to delete property', 'error');
      }
    } catch (error) {
      showToast('Failed to delete property', 'error');
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
            <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
            <p className="text-gray-600 mt-1">Manage your property portfolio</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        </div>

        {properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Add your first property to get started"
            action={{ label: 'Add Property', onClick: () => setShowCreateModal(true) }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div key={property.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{property.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {property.address}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {property.owner_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Owner: {property.owner_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Home className="w-4 h-4" />
                    <span>{property.unit_count || 0} unit(s)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t">
                  <button
                    onClick={() => openUnitsModal(property)}
                    className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Units
                  </button>
                  <button
                    onClick={() => handleDeleteProperty(property.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Property Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Property">
          <form onSubmit={handleCreateProperty} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Flame Towers Apartment"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input"
                placeholder="e.g., 28 May Street, Baku"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select
                value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                className="select"
              >
                <option value="">Select owner (optional)</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Creating...' : 'Create Property'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Units Modal */}
        <Modal
          isOpen={showUnitsModal}
          onClose={() => setShowUnitsModal(false)}
          title={selectedProperty ? `${selectedProperty.name} - Units` : 'Property Units'}
        >
          <div className="space-y-4">
            {selectedProperty?.units && selectedProperty.units.length > 0 ? (
              <div className="space-y-2">
                {selectedProperty.units.map((unit) => (
                  <div key={unit.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium">{unit.unit_number || 'Main Unit'}</div>
                      <div className="text-sm text-gray-500">
                        {unit.bedrooms} bed · {unit.bathrooms} bath · {unit.max_guests} guests
                      </div>
                    </div>
                    <Badge variant="neutral">${unit.cleaning_fee} clean</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No units added yet</p>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Add New Unit</h4>
              <form onSubmit={handleAddUnit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                    <input
                      type="text"
                      value={unitForm.unit_number}
                      onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
                      className="input"
                      placeholder="e.g., 101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cleaning Fee</label>
                    <input
                      type="number"
                      value={unitForm.cleaning_fee}
                      onChange={(e) => setUnitForm({ ...unitForm, cleaning_fee: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                    <input
                      type="number"
                      min={0}
                      value={unitForm.bedrooms}
                      onChange={(e) => setUnitForm({ ...unitForm, bedrooms: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                    <input
                      type="number"
                      min={1}
                      value={unitForm.bathrooms}
                      onChange={(e) => setUnitForm({ ...unitForm, bathrooms: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
                    <input
                      type="number"
                      min={1}
                      value={unitForm.max_guests}
                      onChange={(e) => setUnitForm({ ...unitForm, max_guests: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary w-full">
                  {saving ? 'Adding...' : 'Add Unit'}
                </button>
              </form>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
