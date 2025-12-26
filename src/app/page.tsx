'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, KeyRound, ArrowRight, Loader2 } from 'lucide-react';

type Step = 'email' | 'otp';

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(data.message);
        setStep('otp');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        // Store token in cookie via API response
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
        
        // Redirect based on role
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else if (data.user.role === 'cleaner') {
          router.push('/cleaner');
        } else {
          router.push('/owner');
        }
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-50 via-brand-50/30 to-stone-100 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-stone-900">HostBaku</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Hero text */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-stone-900 mb-3">
              Welcome back
            </h1>
            <p className="text-stone-600">
              Sign in to manage your properties and tasks
            </p>
          </div>

          {/* Login card */}
          <div className="card p-8">
            {step === 'email' ? (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label htmlFor="email" className="label">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-11"
                      placeholder="you@example.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="text-center mb-2">
                  <p className="text-sm text-stone-600">
                    We sent a code to <strong>{email}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setError('');
                    }}
                    className="text-sm text-brand-600 hover:underline mt-1"
                  >
                    Change email
                  </button>
                </div>

                <div>
                  <label htmlFor="otp" className="label">
                    Verification code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input pl-11 text-center text-lg tracking-[0.5em] font-mono"
                      placeholder="000000"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                {message && !error && (
                  <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full text-sm text-stone-500 hover:text-stone-700"
                >
                  Resend code
                </button>
              </form>
            )}
          </div>

          {/* Submit apartment link */}
          <div className="text-center mt-8">
            <p className="text-sm text-stone-500 mb-2">Have a property to list?</p>
            <a
              href="/submit-apartment"
              className="text-brand-600 font-medium hover:underline"
            >
              Submit your apartment →
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} HostBaku. Property Management in Baku.
      </footer>
    </main>
  );
}
