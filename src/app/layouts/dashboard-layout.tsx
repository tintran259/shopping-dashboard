import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationsSocket } from '@/features/notifications';
import { Sidebar } from '@/app/components/sidebar';
import { Topbar } from '@/app/components/topbar';

/** Shown while a lazy route chunk downloads — mirrors the pages' own skeletons. */
function PageFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function DashboardLayout() {
  // Kết nối realtime notification (chỉ sau đăng nhập — layout nằm sau ProtectedRoute).
  useNotificationsSocket();
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
