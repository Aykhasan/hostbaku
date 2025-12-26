'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle, ArrowLeft, Send } from 'lucide-react';

export default function SubmitApartmentPage() {
  const [formData, setFormData] = useState({
    property_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    unit_count: 1,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your property submission has been received. Our team will contact you within 24-48 hours to discuss next steps.
          </p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-brand-600" />
            <span className="text-xl font-bold text-gray-900">HostBaku</span>
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-brand-600">
            ← Back to Login
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Property</h1>
          <p className="text-gray-600">
            Partner with HostBaku to maximize your rental income. We handle everything from guest communication to cleaning.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Name *
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g., Seaside Apartment"
                value={formData.property_name}
                onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Full name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="your@email.com"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  className="input"
                  placeholder="+994 XX XXX XX XX"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Units
                </label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={formData.unit_count}
                  onChange={(e) => setFormData({ ...formData, unit_count: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Address *
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="Full address in Baku"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                className="input min-h-[100px]"
                placeholder="Tell us about your property, current rental situation, expectations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Property
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-brand-600">20%+</div>
            <div className="text-sm text-gray-600">Higher rental income</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-brand-600">100+</div>
            <div className="text-sm text-gray-600">Properties managed</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-brand-600">24/7</div>
            <div className="text-sm text-gray-600">Guest support</div>
          </div>
        </div>
      </main>
    </div>
  );
}
