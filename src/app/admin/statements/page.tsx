'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui';
import { FileText, Download, Calendar, DollarSign, Home, User, Filter, Eye } from 'lucide-react';

interface Statement {
  id: string;
  property_id: string;
  property_name: string;
  owner_id: string;
  owner_name: string;
  month: number;
  year: number;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  is_published: boolean;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string;
}

export default function StatementsPage() {
  const { user } = useAuth();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProperty, setSelectedProperty] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchStatements();
    fetchProperties();
  }, [filterYear]);

  const fetchStatements = async () => {
    try {
      const res = await fetch(`/api/admin/statements?year=${filterYear}`);
      const data = await res.json();
      if (data.success) {
        setStatements(data.data);
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
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

  const generateStatement = async () => {
    if (!selectedProperty) return;
    
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: selectedProperty,
          month: selectedMonth,
          year: selectedYear,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowGenerateModal(false);
        fetchStatements();
      } else {
        alert(data.error || 'Failed to generate statement');
      }
    } catch (error) {
      console.error('Error generating statement:', error);
      alert('Failed to generate statement');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async (statementId: string) => {
    try {
      const res = await fetch(`/api/admin/statements/${statementId}/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${statementId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const publishStatement = async (statementId: string) => {
    try {
      const res = await fetch(`/api/admin/statements/${statementId}/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        fetchStatements();
      }
    } catch (error) {
      console.error('Error publishing statement:', error);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Owner Statements</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and manage monthly owner statements</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Generate Statement
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter by year:</span>
          </div>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="select w-32"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statements List */}
      {statements.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No statements yet</h3>
          <p className="text-gray-500 mb-4">Generate your first owner statement to get started</p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary"
          >
            Generate Statement
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Owner</th>
                <th>Period</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Expenses</th>
                <th className="text-right">Net Income</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((statement) => (
                <tr key={statement.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{statement.property_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{statement.owner_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{monthNames[statement.month - 1]} {statement.year}</span>
                    </div>
                  </td>
                  <td className="text-right text-green-600 font-medium">
                    {formatCurrency(statement.total_revenue)}
                  </td>
                  <td className="text-right text-red-600 font-medium">
                    {formatCurrency(statement.total_expenses)}
                  </td>
                  <td className="text-right font-semibold">
                    <span className={statement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(statement.net_income)}
                    </span>
                  </td>
                  <td>
                    {statement.is_published ? (
                      <span className="badge-success">Published</span>
                    ) : (
                      <span className="badge-warning">Draft</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadPDF(statement.id)}
                        className="p-2 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {!statement.is_published && (
                        <button
                          onClick={() => publishStatement(statement.id)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Publish to Owner"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Statement Modal */}
      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <h2 className="text-xl font-semibold mb-4">Generate Statement</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property
                </label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="select w-full"
                >
                  <option value="">Select a property</option>
                  {properties.filter(p => p.owner_id).map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name} ({property.owner_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="select w-full"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="select w-full"
                  >
                    {[2024, 2025, 2026].map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={generateStatement}
                disabled={!selectedProperty || generating}
                className="btn-primary"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
