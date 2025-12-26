'use client';

import { useState, useEffect } from 'react';
import { Receipt, Plus, Calendar, Building2, Search, Filter, Download } from 'lucide-react';
import { DashboardLayout, Modal, LoadingSpinner, EmptyState, Badge, useToast } from '@/components/ui';
import { Expense, Property } from '@/lib/types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface ExpenseWithDetails extends Expense {
  property_name?: string;
}

const EXPENSE_CATEGORIES = [
  'cleaning_supplies',
  'maintenance',
  'utilities',
  'repairs',
  'amenities',
  'laundry',
  'transportation',
  'commission',
  'other'
];

const CATEGORY_LABELS: Record<string, string> = {
  cleaning_supplies: 'Cleaning Supplies',
  maintenance: 'Maintenance',
  utilities: 'Utilities',
  repairs: 'Repairs',
  amenities: 'Amenities',
  laundry: 'Laundry',
  transportation: 'Transportation',
  commission: 'Commission',
  other: 'Other'
};

export default function ExpensesPage() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [formData, setFormData] = useState({
    property_id: '',
    category: 'cleaning_supplies',
    amount: 0,
    description: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    receipt_url: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchProperties();
  }, [dateRange]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`/api/admin/expenses?start=${dateRange.start}&end=${dateRange.end}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      showToast('Failed to load expenses', 'error');
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

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast('Expense recorded successfully', 'success');
        setShowCreateModal(false);
        setFormData({
          property_id: '',
          category: 'cleaning_supplies',
          amount: 0,
          description: '',
          expense_date: format(new Date(), 'yyyy-MM-dd'),
          receipt_url: ''
        });
        fetchExpenses();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to record expense', 'error');
      }
    } catch (error) {
      showToast('Failed to record expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (filterProperty !== 'all' && expense.property_id !== filterProperty) return false;
    if (filterCategory !== 'all' && expense.category !== filterCategory) return false;
    return true;
  });

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount as any), 0);

  const expensesByCategory = filteredExpenses.reduce((acc, e) => {
    const cat = e.category;
    acc[cat] = (acc[cat] || 0) + parseFloat(e.amount as any);
    return acc;
  }, {} as Record<string, number>);

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
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600 mt-1">Track property-related expenses</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card bg-brand-50 border-brand-100">
            <div className="text-sm text-brand-600 font-medium">Total Expenses</div>
            <div className="text-2xl font-bold text-brand-700 mt-1">${totalAmount.toFixed(2)}</div>
          </div>
          {Object.entries(expensesByCategory).slice(0, 3).map(([cat, amount]) => (
            <div key={cat} className="card">
              <div className="text-sm text-gray-500">{CATEGORY_LABELS[cat] || cat}</div>
              <div className="text-xl font-bold text-gray-900 mt-1">${amount.toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input"
            />
          </div>
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="select w-auto"
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="select w-auto"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>

        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={expenses.length === 0 ? 'No expenses yet' : 'No matching expenses'}
            description={expenses.length === 0 ? 'Record your first expense' : 'Try adjusting your filters'}
            action={expenses.length === 0 ? { label: 'Record Expense', onClick: () => setShowCreateModal(true) } : undefined}
          />
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Property</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {expense.property_name || 'General'}
                        </div>
                      </td>
                      <td>
                        <Badge variant="neutral">
                          {CATEGORY_LABELS[expense.category] || expense.category}
                        </Badge>
                      </td>
                      <td className="text-gray-600">{expense.description}</td>
                      <td className="text-right font-medium">${parseFloat(expense.amount as any).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="font-medium">Total</td>
                    <td className="text-right font-bold">${totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Create Expense Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Record Expense">
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property (optional)</label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                className="select"
              >
                <option value="">General Expense</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="select"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
                placeholder="What was this expense for?"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Recording...' : 'Record Expense'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
