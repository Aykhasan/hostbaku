'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  LayoutDashboard,
  Home,
  Calendar,
  ClipboardList,
  Users,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Loader2,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Wrench,
  Camera,
} from 'lucide-react';
import { User } from '@/lib/types';

// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      // In development, check for dev role in URL or cookie
      let url = '/api/auth/me';
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const devRole = urlParams.get('dev') || document.cookie.split('; ').find(row => row.startsWith('dev-role='))?.split('=')[1];
        if (devRole) {
          url += `?dev=${devRole}`;
        }
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Toast notifications
interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

// Navigation items by role
const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/properties', label: 'Properties', icon: Home },
  { href: '/admin/reservations', label: 'Reservations', icon: Calendar },
  { href: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/admin/cleaners', label: 'Cleaners', icon: Users },
  { href: '/admin/expenses', label: 'Expenses', icon: DollarSign },
  { href: '/admin/statements', label: 'Statements', icon: FileText },
  { href: '/admin/leads', label: 'Leads', icon: UserPlus },
  { href: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
];

const cleanerNavItems = [
  { href: '/cleaner', label: 'My Tasks', icon: ClipboardList },
  { href: '/cleaner/schedule', label: 'Schedule', icon: Calendar },
];

const ownerNavItems = [
  { href: '/owner', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/owner/properties', label: 'Properties', icon: Home },
  { href: '/owner/calendar', label: 'Calendar', icon: Calendar },
  { href: '/owner/statements', label: 'Statements', icon: FileText },
  { href: '/owner/maintenance', label: 'Maintenance', icon: Wrench },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = user.role === 'admin' 
    ? adminNavItems 
    : user.role === 'cleaner' 
      ? cleanerNavItems 
      : ownerNavItems;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-stone-200 z-50 transform transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-stone-900">HostBaku</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-stone-500 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && item.href !== '/cleaner' && item.href !== '/owner' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={isActive ? 'nav-item-active' : 'nav-item-inactive'}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User menu at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-stone-200 bg-white">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-brand-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">{user.name}</p>
              <p className="text-xs text-stone-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="nav-item-inactive w-full mt-1 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:ml-64">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-stone-500 hover:text-stone-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 md:flex-initial" />

          <div className="flex items-center gap-3">
            <button className="p-2 text-stone-500 hover:text-stone-700 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="mobile-nav">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && item.href !== '/cleaner' && item.href !== '/owner' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'mobile-nav-item-active' : 'mobile-nav-item'}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label.split(' ').pop()}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Modal component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }> | ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;
    
    // Check if it's a component (function or has render method)
    if (typeof icon === 'function' || (icon && typeof icon === 'object' && '$$typeof' in icon)) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-12 h-12" />;
    }
    
    // Otherwise, render as ReactNode
    return icon;
  };

  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto w-12 h-12 text-stone-300 mb-4 flex items-center justify-center">
          {renderIcon()}
        </div>
      )}
      <h3 className="text-lg font-medium text-stone-900 mb-1">{title}</h3>
      <p className="text-stone-500 mb-4">{description}</p>
      {action}
    </div>
  );
}

// Stat card component
interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  color?: 'brand' | 'blue' | 'amber' | 'red';
}

export function StatCard({ label, value, icon, trend, color = 'brand' }: StatCardProps) {
  const colorClasses = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-value">{value}</p>
          <p className="stat-label">{label}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-3 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last month
        </div>
      )}
    </div>
  );
}

// Loading spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-brand-600`} />
    </div>
  );
}

// Badge component
interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// Status badge for tasks
export function TaskStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'neutral' | 'info' | 'success'> = {
    todo: 'neutral',
    in_progress: 'info',
    done: 'success',
  };

  const labels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  };

  return <Badge variant={variants[status] || 'neutral'}>{labels[status] || status}</Badge>;
}

// Task type badge
export function TaskTypeBadge({ type }: { type: string }) {
  const variants: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    turnover_clean: 'info',
    deep_clean: 'warning',
    inspection: 'success',
    maintenance: 'danger',
  };

  const labels: Record<string, string> = {
    turnover_clean: 'Turnover',
    deep_clean: 'Deep Clean',
    inspection: 'Inspection',
    maintenance: 'Maintenance',
  };

  return <Badge variant={variants[type] || 'neutral'}>{labels[type] || type}</Badge>;
}

// Photo upload component
interface PhotoUploadProps {
  photos: string[];
  onUpload: (files: FileList) => void;
  onRemove: (index: number) => void;
  maxPhotos?: number;
  loading?: boolean;
}

export function PhotoUpload({ photos, onUpload, onRemove, maxPhotos = 12, loading }: PhotoUploadProps) {
  return (
    <div className="space-y-3">
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-grid-item group">
            <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <label className="photo-grid-item border-2 border-dashed border-stone-300 hover:border-brand-500 cursor-pointer flex items-center justify-center transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && onUpload(e.target.files)}
              className="hidden"
              disabled={loading}
            />
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            ) : (
              <Camera className="w-6 h-6 text-stone-400" />
            )}
          </label>
        )}
      </div>
      <p className="text-xs text-stone-500">
        {photos.length} of {maxPhotos} photos uploaded
      </p>
    </div>
  );
}

