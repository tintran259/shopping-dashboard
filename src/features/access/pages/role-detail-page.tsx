import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ROUTES } from '@/routes/paths';
import { RoleEditor } from '../components/RoleEditor';
import { useRoles } from '../hooks/use-roles';

/** Header rút gọn cho các trạng thái tải/lỗi/không tìm thấy (nội dung dùng RoleEditor). */
function StubHeader() {
  const navigate = useNavigate();
  return (
    <div className="flex items-start gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="mt-0.5"
        onClick={() => navigate(ROUTES.roles)}
      >
        <ArrowLeft className="size-4" />
      </Button>
      <div>
        <p className="text-xs text-muted-foreground">Vai trò · Chi tiết</p>
        <h1 className="text-2xl font-semibold tracking-tight">Chi tiết vai trò</h1>
      </div>
    </div>
  );
}

export function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useRoles();
  const role = query.data?.find((r) => r.id === id) ?? null;

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <StubHeader />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="space-y-6">
        <StubHeader />
        <ErrorState onRetry={() => query.refetch()} />
      </div>
    );
  }
  if (!role) {
    return (
      <div className="space-y-6">
        <StubHeader />
        <EmptyState
          title="Không tìm thấy vai trò"
          description="Vai trò có thể đã bị xóa."
          action={
            <Button variant="outline" onClick={() => navigate(ROUTES.roles)}>
              Về danh sách vai trò
            </Button>
          }
        />
      </div>
    );
  }
  // key theo id: chuyển giữa các vai trò (đổi URL) sẽ remount, tránh state cũ.
  return <RoleEditor key={role.id} role={role} />;
}
