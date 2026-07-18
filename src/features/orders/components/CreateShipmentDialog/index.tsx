import { useEffect, useState } from 'react';
import { Package, Store, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useBranches } from '@/features/inventory';
import { useProvinces } from '@/features/locations';
import { PaymentStatus } from '@/types';
import { formatCurrency } from '@/lib/format';
import { CarrierLogo } from '../CarrierLogo';
import { useCreateGhtkShipment } from '../../hooks/use-order-mutations';
import type { Order } from '../../types';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/**
 * Full preview + form for explicitly creating a real GHTK shipping order —
 * shows exactly what will be sent to the carrier (sender, receiver, package/value)
 * before the admin commits, since this calls GHTK's real API. Admin must supply
 * the delivery district (the one field our location data can't derive — see
 * `CreateGhtkShipmentDto`).
 */
export function CreateShipmentDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}) {
  const { data: branches } = useBranches();
  const { data: provinces } = useProvinces();
  const createGhtk = useCreateGhtkShipment(order.id);
  const [district, setDistrict] = useState('');
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setDistrict('');
      setDistrictError(null);
      setNote('');
    }
  }, [open]);

  const branch = branches?.find((b) => b.id === order.branchId);
  const branchProvinceName = provinces?.find(
    (p) => String(p.code) === branch?.provinceCode,
  )?.name;

  const addr = order.shippingAddress;
  const isCod = order.paymentStatus !== PaymentStatus.PAID;

  const onConfirm = () => {
    const value = district.trim();
    if (!value) {
      setDistrictError('Bắt buộc nhập quận/huyện giao hàng');
      return;
    }
    createGhtk.mutate(
      { district: value, note: note.trim() || undefined },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-[38rem] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CarrierLogo carrier="GHTK" />
            Tạo vận đơn GHTK
          </DialogTitle>
          <DialogDescription>
            Kiểm tra lại thông tin trước khi gửi — hệ thống sẽ gọi API thật của GHTK để tạo
            đơn vận chuyển.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section className="space-y-1.5 rounded-md border p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Store className="size-3.5" /> Người gửi (lấy hàng)
            </p>
            <InfoRow label="Chi nhánh" value={branch?.name ?? '—'} />
            <InfoRow label="Điện thoại" value={branch?.phone ?? '—'} />
            <InfoRow
              label="Địa chỉ"
              value={
                [
                  branch?.address,
                  branch?.ghtkPickupWard,
                  branch?.ghtkPickupDistrict,
                  branchProvinceName,
                ]
                  .filter(Boolean)
                  .join(', ') || '—'
              }
            />
            {(!branch?.ghtkPickupDistrict || !branch?.ghtkPickupWard) && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Chi nhánh chưa cấu hình quận/huyện, phường/xã lấy hàng cho GHTK — vào trang Chi
                nhánh để thêm.
              </p>
            )}
          </section>

          <section className="space-y-1.5 rounded-md border p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <User className="size-3.5" /> Người nhận (giao hàng)
            </p>
            <InfoRow label="Tên" value={addr?.recipientName ?? order.recipientName} />
            <InfoRow label="Điện thoại" value={addr?.phone ?? order.recipientPhone} />
            <InfoRow
              label="Địa chỉ"
              value={[addr?.street, addr?.wardName, addr?.provinceName].filter(Boolean).join(', ')}
            />
            <div className="space-y-1 pt-1.5">
                <Label htmlFor="ghtk-district" className="text-xs">
                  Quận/huyện giao hàng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ghtk-district"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setDistrictError(null);
                  }}
                  placeholder="VD: Quận 1"
                />
                {districtError && <p className="text-xs text-destructive">{districtError}</p>}
                <p className="text-xs text-muted-foreground">
                  GHTK yêu cầu — địa chỉ của mình chỉ còn Tỉnh/Phường nên không tự suy ra được.
                </p>
            </div>
          </section>

          <section className="space-y-1.5 rounded-md border p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Package className="size-3.5" /> Kiện hàng
            </p>
            <div className="space-y-1 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="tabular-nums">{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-1.5" />
            <InfoRow label="Giá trị khai báo" value={formatCurrency(order.grandTotal)} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Thu hộ (COD)</span>
              <Badge variant={isCod ? 'warning' : 'muted'}>
                {isCod ? formatCurrency(order.grandTotal) : 'Không thu hộ — đã thanh toán'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Cân nặng tính tự động theo cân nặng từng sản phẩm khi tạo vận đơn.
            </p>
          </section>

          <div className="space-y-1.5">
            <Label htmlFor="carrier-note" className="text-xs">
              Ghi chú cho đơn vị vận chuyển (không bắt buộc)
            </Label>
            <Input
              id="carrier-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              placeholder="VD: Gọi trước khi giao"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" loading={createGhtk.isPending} onClick={onConfirm}>
            Xác nhận tạo vận đơn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
