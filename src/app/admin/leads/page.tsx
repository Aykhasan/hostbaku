'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui';
import { 
  UserPlus, Phone, Mail, MapPin, Layout, Link as LinkIcon, 
  Calendar, Check, X, MessageSquare, ExternalLink, Filter,
  Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

interface Lead {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  location: string;
  layout: string;
  listing_link: string | null;
  notes: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  new: { label: 'New', color: 'badge-info', icon: Clock },
  contacted: { label: 'Contacted', color: 'badge-warning', icon: AlertCircle },
  qualified: { label: 'Qualified', color: 'badge-success', icon: CheckCircle },
  converted: { label: 'Converted', color: 'badge-success', icon: Check },
  rejected: { label: 'Rejected', color: 'badge-danger', icon: XCircle },
};

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [filterStatus]);

  const fetchLeads = async () => {
    try {
      const url = filterStatus === 'all' 
        ? '/api/admin/leads'
        : `/api/admin/leads?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    setUpdatingStatus(leadId);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
        if (selectedLead?.id === leadId) {
          setSelectedLead({ ...selectedLead, status: status as Lead['status'] });
        }
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const addNote = async (leadId: string, note: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: note }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
        if (selectedLead) {
          setSelectedLead({ ...selectedLead, notes: note });
        }
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  const StatusIcon = ({ status }: { status: Lead['status'] }) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Manage apartment submission inquiries</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-green-600">{leads.filter(l => l.status === 'new').length}</span>
            <span>new leads</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Status:</span>
          </div>
          <div className="flex gap-2">
            {['all', 'new', 'contacted', 'qualified', 'converted', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterStatus === status
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads Grid */}
      {leads.length === 0 ? (
        <div className="card p-12 text-center">
          <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
          <p className="text-gray-500">Leads will appear here when property owners submit the apartment form</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => {
            const config = statusConfig[lead.status];
            return (
              <div
                key={lead.id}
                className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openLeadDetail(lead)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{lead.contact_name}</h3>
                    <p className="text-sm text-gray-500">{lead.location}</p>
                  </div>
                  <span className={`${config.color} flex items-center gap-1`}>
                    <StatusIcon status={lead.status} />
                    {config.label}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Layout className="w-4 h-4 text-gray-400" />
                    <span>{lead.layout}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{lead.contact_email}</span>
                  </div>
                  {lead.contact_phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{lead.contact_phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {formatDate(lead.created_at)}
                  </span>
                  {lead.listing_link && (
                    <a
                      href={lead.listing_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Listing
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Modal */}
      {showDetailModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selectedLead.contact_name}</h2>
                <p className="text-sm text-gray-500">{selectedLead.location}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${selectedLead.contact_email}`} className="text-brand-600 hover:underline">
                    {selectedLead.contact_email}
                  </a>
                </div>
                {selectedLead.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a href={`tel:${selectedLead.contact_phone}`} className="text-brand-600 hover:underline">
                      {selectedLead.contact_phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Layout className="w-5 h-5 text-gray-400" />
                  <span>{selectedLead.layout}</span>
                </div>
                {selectedLead.listing_link && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className="w-5 h-5 text-gray-400" />
                    <a
                      href={selectedLead.listing_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline flex items-center gap-1"
                    >
                      View Listing <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <button
                      key={status}
                      onClick={() => updateLeadStatus(selectedLead.id, status)}
                      disabled={updatingStatus === selectedLead.id}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                        selectedLead.status === status
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <config.icon className="w-3 h-3" />
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={selectedLead.notes || ''}
                  onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                  onBlur={(e) => addNote(selectedLead.id, e.target.value)}
                  placeholder="Add notes about this lead..."
                  className="input w-full h-24 resize-none"
                />
              </div>

              {/* Timeline */}
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Submitted: {formatDate(selectedLead.created_at)}</span>
                </div>
                {selectedLead.updated_at !== selectedLead.created_at && (
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>Updated: {formatDate(selectedLead.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <a
                href={`mailto:${selectedLead.contact_email}?subject=Your HostBaku Apartment Submission`}
                className="btn-primary flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
