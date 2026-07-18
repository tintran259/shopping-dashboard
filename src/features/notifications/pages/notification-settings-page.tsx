import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { Switch } from '@/components/shared/switch';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../hooks/use-notifications';
import { NOTIFICATION_META } from '../lib/notification-meta';
import { NOTIFICATION_TYPES } from '../types';

export function NotificationSettingsPage() {
  const { data: settings, isLoading } = useNotificationSettings();
  const update = useUpdateNotificationSettings();

  const enabledOf = (type: string) =>
    settings?.find((s) => s.type === type)?.enabled ?? true;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt thông báo"
        description="Chọn loại thông báo bạn muốn nhận. Tắt loại nào thì bạn sẽ không nhận thông báo loại đó, dù có quyền truy cập."
      />

      <Card>
        <CardContent className="divide-y p-0">
          {NOTIFICATION_TYPES.map((type) => {
            const meta = NOTIFICATION_META[type];
            const Icon = meta.icon;
            return (
              <div key={type} className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{meta.label}</p>
                    {!meta.implemented && (
                      <Badge variant="muted">Sắp có</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {meta.description}
                  </p>
                </div>
                <Switch
                  checked={meta.implemented ? enabledOf(type) : false}
                  disabled={!meta.implemented || isLoading || update.isPending}
                  onCheckedChange={(enabled) =>
                    update.mutate([{ type, enabled }])
                  }
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
