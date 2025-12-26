'use client';

import { AuthProvider, ToastProvider, DashboardLayout } from '@/components/ui';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
