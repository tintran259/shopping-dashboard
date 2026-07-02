import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/app/components/sidebar';
import { Topbar } from '@/app/components/topbar';

export function DashboardLayout() {
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
