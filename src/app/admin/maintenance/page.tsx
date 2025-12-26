'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui';
import { 
  Wrench, Plus, AlertTriangle, Clock, CheckCircle, Home, 
  User, Calendar, MessageSquare, Filter, X
} from 'lucide-react';

interface MaintenanceTicket {
  id: string;
  property_id: string;
  property_name: string;
  unit_id: string | null;
  unit_name: string | null;
  reported_by: string;
  reporter_name: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
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

export default function MaintenancePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  
  const [newTicket, setNewTicket] = useState({
    property_id: '',
    title: '',
    description: '',
    priority: 'medium' as const,
  });

  useEffect(() => {
    fetchTickets();
    fetchProperties();
  }, [filterStatus, filterPriority]);

  const fetchTickets = async () => {
    try {
      let url = '/api/admin/maintenance?';
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      if (filterPriority !== 'all') url += `priority=${filterPriority}`;
      
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
      const res = await fetch('/api/admin/properties?limit=100');
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
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewTicket({ property_id: '', title: '', description: '', priority: 'medium' });
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/maintenance/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: status as MaintenanceTicket['status'] });
        }
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const resolveTicket = async (ticketId: string, notes: string) => {
    try {
      const res = await fetch(`/api/admin/maintenance/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'resolved',
          resolution_notes: notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTickets();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error resolving ticket:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const openTicketDetail = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  const openCount = tickets.filter(t => t.status === 'open').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage maintenance tickets</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-900">{tickets.length}</div>
          <div className="text-sm text-gray-500">Total Tickets</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-red-600">{openCount}</div>
          <div className="text-sm text-gray-500">Open</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-orange-600">{urgentCount}</div>
          <div className="text-sm text-gray-500">Urgent</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-green-600">
            {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
          </div>
          <div className="text-sm text-gray-500">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="select"
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="card p-12 text-center">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance tickets</h3>
          <p className="text-gray-500 mb-4">Create a ticket to track maintenance issues</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const statusConf = statusConfig[ticket.status];
            const priorityConf = priorityConfig[ticket.priority];
            const StatusIcon = statusConf.icon;
            
            return (
              <div
                key={ticket.id}
                className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openTicketDetail(ticket)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={priorityConf.color}>{priorityConf.label}</span>
                      <span className={`${statusConf.color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConf.label}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{ticket.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{ticket.description}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Home className="w-4 h-4" />
                      {ticket.property_name}
                    </div>
                    <div className="text-gray-400 mt-1">
                      {formatDate(ticket.created_at)}
                    </div>
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
              <h2 className="text-xl font-semibold">New Maintenance Ticket</h2>
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
                  Title *
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
                  placeholder="Detailed description of the maintenance issue..."
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
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
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
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showDetailModal && selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setShowDetailModal(false)}
          onStatusChange={updateTicketStatus}
          onResolve={resolveTicket}
        />
      )}
    </div>
  );
}

function TicketDetailModal({
  ticket,
  onClose,
  onStatusChange,
  onResolve,
}: {
  ticket: MaintenanceTicket;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onResolve: (id: string, notes: string) => void;
}) {
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolution_notes || '');
  const [showResolveForm, setShowResolveForm] = useState(false);

  const statusConf = statusConfig[ticket.status];
  const priorityConf = priorityConfig[ticket.priority];
  const StatusIcon = statusConf.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={priorityConf.color}>{priorityConf.label}</span>
              <span className={`${statusConf.color} flex items-center gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {statusConf.label}
              </span>
            </div>
            <h2 className="text-xl font-semibold">{ticket.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Home className="w-4 h-4" />
              <span>{ticket.property_name}</span>
              {ticket.unit_name && <span>• {ticket.unit_name}</span>}
            </div>
            <p className="text-gray-700">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Created</div>
              <div className="font-medium">{formatDate(ticket.created_at)}</div>
            </div>
            {ticket.resolved_at && (
              <div>
                <div className="text-gray-500">Resolved</div>
                <div className="font-medium">{formatDate(ticket.resolved_at)}</div>
              </div>
            )}
          </div>

          {ticket.resolution_notes && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Resolution Notes</div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800">
                {ticket.resolution_notes}
              </div>
            </div>
          )}

          {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Update Status</div>
              <div className="flex gap-2 flex-wrap">
                {ticket.status === 'open' && (
                  <button
                    onClick={() => onStatusChange(ticket.id, 'in_progress')}
                    className="btn-secondary text-sm"
                  >
                    Start Working
                  </button>
                )}
                <button
                  onClick={() => setShowResolveForm(true)}
                  className="btn-primary text-sm"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          )}

          {showResolveForm && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the issue was resolved..."
                className="input w-full h-24 resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowResolveForm(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onResolve(ticket.id, resolutionNotes)}
                  className="btn-primary text-sm"
                >
                  Resolve Ticket
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
