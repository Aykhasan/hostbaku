'use client';

import { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/components/ui';
import { 
  Wrench, Plus, AlertTriangle, Clock, CheckCircle, Home, 
  Calendar, X, Filter
} from 'lucide-react';

interface MaintenanceTicket {
  id: string;
  property_id: string;
  property_name: string;
  unit_name: string | null;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface Property {
  id: string;
  name: string;
}

const priorityConfig = {
  low: { label: 'Low', color: 'badge-neutral' },
  medium: { label: 'Medium', color: 'badge-info' },
  high: { label: 'High', color: 'badge-warning' },
  urgent: { label: 'Urgent', color: 'badge-danger' },
};

const statusConfig = {
  open: { label: 'Open', color: 'badge-danger', icon: AlertTriangle },
  in_progress: { label: 'In Progress', color: 'badge-warning', icon: Clock },
  resolved: { label: 'Resolved', color: 'badge-success', icon: CheckCircle },
  closed: { label: 'Closed', color: 'badge-neutral', icon: CheckCircle },
};

export default function OwnerMaintenancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [newTicket, setNewTicket] = useState({
    property_id: '',
    title: '',
    description: '',
    priority: 'medium' as const,
  });

  useEffect(() => {
    fetchTickets();
    fetchProperties();
  }, [filterStatus]);

  const fetchTickets = async () => {
    try {
      let url = '/api/owner/maintenance';
      if (filterStatus !== 'all') {
        url += `?status=${filterStatus}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/owner/properties');
      const data = await res.json();
      if (data.success) {
        setProperties(data.data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const createTicket = async () => {
    if (!newTicket.property_id || !newTicket.title) return;
    
    try {
      const res = await fetch('/api/owner/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewTicket({ property_id: '', title: '', description: '', priority: 'medium' });
        fetchTickets();
        showToast('Maintenance ticket created', 'success');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      showToast('Failed to create ticket', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-1">Report and track property issues</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{tickets.length}</div>
          <div className="text-sm text-gray-500">Total Tickets</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{openCount}</div>
          <div className="text-sm text-gray-500">Open</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
          </div>
          <div className="text-sm text-gray-500">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex gap-2">
            {['all', 'open', 'in_progress', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterStatus === status
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="card p-12 text-center">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance tickets</h3>
          <p className="text-gray-500 mb-4">Report an issue to create a maintenance ticket</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Report Issue
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const statusConf = statusConfig[ticket.status];
            const priorityConf = priorityConfig[ticket.priority];
            const StatusIcon = statusConf.icon;
            
            return (
              <div key={ticket.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={priorityConf.color}>{priorityConf.label}</span>
                      <span className={`${statusConf.color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConf.label}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        {ticket.property_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(ticket.created_at)}
                      </div>
                    </div>

                    {ticket.resolution_notes && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">Resolution: </span>
                          {ticket.resolution_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Report Issue</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property *
                </label>
                <select
                  value={newTicket.property_id}
                  onChange={(e) => setNewTicket({ ...newTicket, property_id: e.target.value })}
                  className="select w-full"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Title *
                </label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Provide more details about the issue..."
                  className="input w-full h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                  className="select w-full"
                >
                  <option value="low">Low - Can wait</option>
                  <option value="medium">Medium - Should be addressed soon</option>
                  <option value="high">High - Needs attention</option>
                  <option value="urgent">Urgent - Immediate attention required</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={createTicket}
                disabled={!newTicket.property_id || !newTicket.title}
                className="btn-primary"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
