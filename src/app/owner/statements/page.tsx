'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui';
import { FileText, Download, Calendar, DollarSign, TrendingUp, Filter } from 'lucide-react';

interface Statement {
  id: string;
  property_id: string;
  property_name: string;
  month: number;
  year: number;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  is_published: boolean;
  created_at: string;
}

export default function OwnerStatementsPage() {
  const { user } = useAuth();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchStatements();
    fetchProperties();
  }, [selectedYear, selectedProperty]);

  const fetchStatements = async () => {
    try {
      let url = `/api/owner/statements?year=${selectedYear}`;
      if (selectedProperty !== 'all') {
        url += `&property_id=${selectedProperty}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStatements(data.data.filter((s: Statement) => s.is_published));
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
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

  const downloadPDF = async (statementId: string) => {
    try {
      const res = await fetch(`/api/owner/statements/${statementId}/pdf`);
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

  // Calculate totals
  const totals = statements.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.total_revenue,
      expenses: acc.expenses + s.total_expenses,
      net: acc.net + s.net_income,
    }),
    { revenue: 0, expenses: 0, net: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Monthly Statements</h1>
        <p className="text-sm text-gray-500 mt-1">View your property income and expense reports</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter:</span>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="select"
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="select"
          >
            <option value="all">All Properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Year Summary */}
      {statements.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.revenue)}
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              Total Expenses
            </div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.expenses)}
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              Net Income
            </div>
            <div className={`text-2xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.net)}
            </div>
          </div>
        </div>
      )}

      {/* Statements List */}
      {statements.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No statements available</h3>
          <p className="text-gray-500">Monthly statements will appear here once published</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statements.map((statement) => (
            <div key={statement.id} className="card overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {monthNames[statement.month - 1]} {statement.year}
                    </h3>
                    <p className="text-sm text-gray-500">{statement.property_name}</p>
                  </div>
                  <button
                    onClick={() => downloadPDF(statement.id)}
                    className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Revenue</span>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(statement.total_revenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expenses</span>
                  <span className="text-red-600 font-medium">
                    {formatCurrency(statement.total_expenses)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-medium text-gray-700">Net Income</span>
                  <span className={`font-bold ${statement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(statement.net_income)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
