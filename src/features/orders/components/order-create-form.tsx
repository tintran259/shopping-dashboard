import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormField } from '@/components/shared/form-field';
import { MoneyInput } from '@/components/shared/money-input';
import { FulfillmentType, ShippingMethodCode } from '@/types';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  stockAvailability,
  useBranches,
  useVariantsStock,
} from '@/features/inventory';
import { useProvinces, useWards } from '@/features/locations';
import {
  BO_PAYMENT_METHODS,
  FULFILLMENT_LABEL,
  PAYMENT_METHOD_LABEL,
  SHIPPING_METHOD_LABEL,
} from '../lib/labels';
import {
  emptyOrderForm,
  orderFormSchema,
  type OrderFormValues,
} from '../lib/order-schema';
import { useValidateVoucher } from '../hooks/use-order-mutations';
import { OrderItemsField } from './order-items-field';

export const ORDER_FORM_ID = 'order-create-form';

interface OrderCreateFormProps {
  onSubmit: (values: OrderFormValues) => void;
}

/**
 * Staff-entered order form (phone order, walk-in…). Every money figure shown
 * here (subtotal/total/discount) is a client preview from already-known
 * variant prices — the BE recomputes and owns the authoritative numbers once
 * the order is actually submitted (golden rule: never trust FE math for money).
 */
export function OrderCreateForm({ onSubmit }: OrderCreateFormProps) {
  const { data: branches } = useBranches();
  const { data: provinces } = useProvinces();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: emptyOrderForm(),
  });

  const branchId = form.watch('branchId');
  const fulfillment = form.watch('fulfillment');
  const provinceCode = form.watch('provinceCode');
  const wantInvoice = form.watch('wantInvoice');
  const items = form.watch('items');
  const shippingFee = form.watch('shippingFee');
  const shippingMethod = form.watch('shippingMethod');
  const voucherCode = form.watch('voucherCode');
  const isDelivery = fulfillment === FulfillmentType.DELIVERY;

  const { data: wards } = useWards(provinceCode);

  const validateVoucher = useValidateVoucher();
  const [voucherResult, setVoucherResult] = useState<{ discount: number } | null>(
    null,
  );

  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const fee = Number(shippingFee || 0);
  const discount = voucherResult?.discount ?? 0;

  // Giỏ hàng/phí ship/mã đổi sau khi đã "Kiểm tra" → số giảm giá đang hiển thị
  // không còn đúng với subtotal mới nữa, ẩn đi cho tới khi kiểm tra lại.
  const itemsSignature = items.map((i) => `${i.variantId}:${i.quantity}`).join(',');
  useEffect(() => {
    setVoucherResult(null);
  }, [itemsSignature, fee, voucherCode, shippingMethod, branchId]);

  // Nhận tại cửa hàng thì không có phí ship — ô phí ship cũng ẩn khi ở chế độ
  // này, nếu không reset về 0 thì giá trị cũ (nhập lúc còn ở Giao hàng) sẽ âm
  // thầm bị gửi kèm dù không còn ô nào hiển thị để admin sửa lại.
  useEffect(() => {
    if (fulfillment === FulfillmentType.PICKUP) {
      form.setValue('shippingFee', '0');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillment]);

  // Tồn kho từng dòng tại chi nhánh đang chọn (dùng chung cache với từng dòng).
  // Chặn tạo đơn nếu có sản phẩm vượt tồn (trừ hàng đặt trước) — BE cũng kiểm
  // tra lại, đây là lớp UX chặn sớm với thông báo rõ ràng.
  const stockResults = useVariantsStock(items.map((i) => i.variantId));
  const stockIssues = branchId
    ? items.filter((it, idx) => {
        const avail = stockAvailability(stockResults[idx]?.data, branchId);
        return !!avail && !avail.isPreorder && it.quantity > avail.available;
      })
    : [];

  const handleValidatedSubmit = (values: OrderFormValues) => {
    if (stockIssues.length > 0) {
      toast.error(
        'Có sản phẩm vượt tồn kho tại chi nhánh — giảm số lượng hoặc đổi chi nhánh trước khi tạo đơn.',
      );
      return;
    }
    onSubmit(values);
  };

  const handleValidateVoucher = () => {
    const code = voucherCode?.trim();
    if (!code) return;
    setVoucherResult(null);
    validateVoucher.mutate(
      {
        code,
        subtotal,
        shippingFee: fee,
        // Gửi chi nhánh để voucher giới hạn chi nhánh preview đúng như lúc
        // submit (payload tạo đơn luôn kèm branchId).
        ...(branchId ? { branchId } : {}),
        // Chỉ đơn giao tận nơi mới có phương thức — để voucher ship giới hạn
        // phương thức (vd chỉ "giao nhanh") preview đúng như BE enforce.
        ...(isDelivery ? { shippingMethod } : {}),
      },
      { onSuccess: (res) => setVoucherResult({ discount: res.discount }) },
    );
  };

  return (
    <Form {...form}>
      <form
        id={ORDER_FORM_ID}
        onSubmit={form.handleSubmit(handleValidatedSubmit)}
        className="space-y-6"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Chi nhánh &amp; hình thức</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="branchId"
                  label="Chi nhánh xử lý"
                  render={(f) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chi nhánh" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches?.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fulfillment"
                  label="Hình thức nhận hàng"
                  render={(f) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(FulfillmentType).map((v) => (
                          <SelectItem key={v} value={v}>
                            {FULFILLMENT_LABEL[v]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentMethodCode"
                  label="Phương thức thanh toán"
                  className="sm:col-span-2"
                  render={(f) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BO_PAYMENT_METHODS.map((v) => (
                          <SelectItem key={v} value={v}>
                            {PAYMENT_METHOD_LABEL[v]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Người nhận</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="recipientName"
                    label="Họ tên"
                    render={(f) => <Input {...f} placeholder="Nhập họ tên người nhận…" />}
                  />
                  <FormField
                    control={form.control}
                    name="recipientPhone"
                    label="Số điện thoại"
                    render={(f) => <Input {...f} placeholder="Nhập số điện thoại…" />}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="recipientEmail"
                  label="Email (tùy chọn)"
                  render={(f) => (
                    <Input {...f} value={f.value ?? ''} placeholder="Nhập email…" />
                  )}
                />

                {fulfillment === FulfillmentType.DELIVERY && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="provinceCode"
                      label="Tỉnh/Thành"
                      render={(f) => (
                        <Select
                          value={f.value ? String(f.value) : ''}
                          onValueChange={(v) => {
                            f.onChange(Number(v));
                            form.setValue('wardCode', undefined);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tỉnh/thành" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces?.map((p) => (
                              <SelectItem key={p.code} value={String(p.code)}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="wardCode"
                      label="Phường/Xã"
                      render={(f) => (
                        <Select
                          value={f.value ? String(f.value) : ''}
                          onValueChange={(v) => f.onChange(Number(v))}
                          disabled={!provinceCode}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn phường/xã" />
                          </SelectTrigger>
                          <SelectContent>
                            {wards?.map((w) => (
                              <SelectItem key={w.code} value={String(w.code)}>
                                {w.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="street"
                      label="Địa chỉ cụ thể"
                      className="sm:col-span-2"
                      render={(f) => (
                        <Input
                          {...f}
                          value={f.value ?? ''}
                          placeholder="Nhập số nhà, tên đường…"
                        />
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                {!branchId && (
                  <div className="mb-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Hãy <strong>chọn chi nhánh xử lý</strong> ở trên trước khi
                      tìm sản phẩm — ô tìm kiếm đang tạm khóa vì tồn kho được
                      hiển thị và kiểm theo từng chi nhánh.
                    </span>
                  </div>
                )}
                <OrderItemsField control={form.control} branchId={branchId} />
                {form.formState.errors.items?.message && (
                  <p className="mt-2 text-xs font-medium text-destructive">
                    {form.formState.errors.items.message}
                  </p>
                )}
                {stockIssues.length > 0 && (
                  <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <p className="flex items-center gap-1 font-medium">
                      <AlertTriangle className="size-3.5" />
                      Vượt tồn kho tại chi nhánh
                    </p>
                    <p className="mt-0.5">
                      {stockIssues.map((i) => i.productName).join(', ')} — giảm số
                      lượng hoặc đổi chi nhánh trước khi tạo đơn.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vận chuyển &amp; giảm giá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isDelivery && (
                  <FormField
                    control={form.control}
                    name="shippingMethod"
                    label="Phương thức giao"
                    render={(f) => (
                      <div className="flex gap-2">
                        {Object.values(ShippingMethodCode).map((m) => {
                          const active = f.value === m;
                          const isExpress = m === ShippingMethodCode.EXPRESS;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => f.onChange(m)}
                              className={cn(
                                'flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                                active && isExpress
                                  ? 'border-warning bg-warning/15 text-warning'
                                  : active
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-accent',
                              )}
                            >
                              {SHIPPING_METHOD_LABEL[m]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                )}
                {isDelivery && (
                  <FormField
                    control={form.control}
                    name="shippingFee"
                    label="Phí vận chuyển"
                    render={(f) => (
                      <MoneyInput
                        {...f}
                        value={f.value ?? ''}
                        placeholder="Nhập phí vận chuyển…"
                      />
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="voucherCode"
                  label="Mã giảm giá (tùy chọn)"
                  render={(f) => (
                    <div className="flex gap-2">
                      <Input
                        {...f}
                        value={f.value ?? ''}
                        placeholder="Nhập mã giảm giá…"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        loading={validateVoucher.isPending}
                        disabled={!f.value?.trim() || items.length === 0}
                        onClick={handleValidateVoucher}
                      >
                        Kiểm tra
                      </Button>
                    </div>
                  )}
                />
                {voucherResult && (
                  <p className="text-xs text-emerald-600">
                    Áp dụng được — giảm {formatCurrency(String(voucherResult.discount))}{' '}
                    (tạm tính).
                  </p>
                )}
                <FormField
                  control={form.control}
                  name="notes"
                  label="Ghi chú"
                  render={(f) => (
                    <Textarea
                      {...f}
                      value={f.value ?? ''}
                      rows={3}
                      placeholder="Nhập ghi chú cho đơn hàng…"
                    />
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hóa đơn VAT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => form.setValue('wantInvoice', false)}
                    className={cn(
                      'flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors',
                      !wantInvoice
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    Không xuất
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setValue('wantInvoice', true)}
                    className={cn(
                      'flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors',
                      wantInvoice
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    Xuất hóa đơn
                  </button>
                </div>
                {wantInvoice && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="invoiceCompanyName"
                      label="Tên công ty"
                      render={(f) => (
                        <Input {...f} value={f.value ?? ''} placeholder="Nhập tên công ty…" />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceTaxCode"
                      label="Mã số thuế"
                      render={(f) => (
                        <Input {...f} value={f.value ?? ''} placeholder="Nhập mã số thuế…" />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceAddress"
                      label="Địa chỉ công ty"
                      render={(f) => (
                        <Input
                          {...f}
                          value={f.value ?? ''}
                          placeholder="Nhập địa chỉ công ty…"
                        />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceEmail"
                      label="Email nhận hóa đơn"
                      render={(f) => (
                        <Input {...f} value={f.value ?? ''} placeholder="Nhập email…" />
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tổng cộng (tạm tính)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="tabular-nums">{formatCurrency(String(subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className="tabular-nums">{formatCurrency(String(fee))}</span>
                </div>
                {voucherResult && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá</span>
                    <span className="tabular-nums">
                      -{formatCurrency(String(voucherResult.discount))}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                  <span>Tổng (tạm tính)</span>
                  <span className="tabular-nums">
                    {formatCurrency(String(subtotal + fee - discount))}
                  </span>
                </div>
                <p className="pt-1 text-xs text-muted-foreground">
                  Số liệu cuối cùng do hệ thống tính khi tạo đơn.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
