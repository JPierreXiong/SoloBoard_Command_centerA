import { redirect } from 'next/navigation';
import { PERMISSIONS, requirePermission } from '@/core/rbac';
import AdminDashboardClient from './client';

export default async function AdminDashboard() {
  // Check admin permission
  try {
    await requirePermission({
      code: PERMISSIONS.ADMIN_ACCESS,
      redirectUrl: '/dashboard',
    });
  } catch (error) {
    redirect('/dashboard');
  }

  return <AdminDashboardClient />;
}
