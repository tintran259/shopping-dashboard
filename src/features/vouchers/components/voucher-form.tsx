import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CalendarDays } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form } from '@/components/ui/form';
import { FormField } from '@/components/shared/form-field';
import { MoneyInput } from '@/components/shared/money-input';
import { Switch } from '@/components/shared/switch';
import { VoucherCustomerScope, VoucherType } from '@/types';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { BranchMultiSelect } from './branch-multi-select';
import { CustomerMultiPicker } from './customer-multi-picker';
import { ProductMultiPicker } from './product-multi-picker';
import { VOUCHER_TYPE_LABEL } from '../lib/labels';
import { voucherFormSchema, type VoucherFormValues } from '../lib/schema';

/** Form element id — pages render the submit button in the top-right header,
 *  matching the Product form's convention. */
export const VOUCHER_FORM_ID = 'voucher-form';

interface VoucherFormProps {
  defaultValues: VoucherFormValues;
  onSubmit: (values: VoucherFormValues) => void;
}

function DatePickerField({
  value,
  onChange,
  placeholder,
  endOfDay,
}: {
  value?: string;
  onChange: (iso: string | undefined) => void;
  placeholder: string;
  /** Normalize the picked day to 23:59:59.999 instead of local midnight — for an
   *  "ends at" field, picking "July 5" must mean the voucher is valid through the
   *  end of July 5, not expired at its very start. */
  endOfDay?: boolean;
}) {
  const date = value ? new Date(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          <CalendarDays className="size-4 text-muted-foreground" />
          {date ? formatDate(date) : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (!d) return onChange(undefined);
            if (endOfDay) d.setHours(23, 59, 59, 999);
            onChange(d.toISOString());
          }}
        />
        {date && (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange(undefined)}>
              Bỏ chọn (không giới hạn)
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function VoucherForm({ defaultValues, onSubmit }: VoucherFormProps) {
  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherFormSchema),
    defaultValues,
  });
  const watchType = form.watch('type');
  const products = form.watch('products');
  const branches = form.watch('branches');
  const customerScope = form.watch('customerScope');
  const customers = form.watch('customers');

  return (
    <Form {...form}>
      <form
        id={VOUCHER_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin mã giảm giá</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  label="Mã"
                  render={(f) => (
                    <Input
                      {...f}
                      placeholder="WELCOME15"
                      className="font-mono uppercase"
                      onChange={(e) => f.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  label="Loại"
                  render={(f) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(VoucherType).map((t) => (
                          <SelectItem key={t} value={t}>
                            {VOUCHER_TYPE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  label={watchType === VoucherType.PERCENT ? 'Giá trị (%)' : 'Giá trị (đ)'}
                  render={(f) =>
                    watchType === VoucherType.PERCENT ? (
                      <Input {...f} placeholder="15" />
                    ) : (
                      <MoneyInput value={f.value ?? ''} onChange={f.onChange} />
                    )
                  }
                />
                <FormField
                  control={form.control}
                  name="minSubtotal"
                  label="Đơn tối thiểu"
                  render={(f) => (
                    <MoneyInput value={f.value ?? ''} onChange={f.onChange} placeholder="Không yêu cầu" />
                  )}
                />
              </div>

              {watchType === VoucherType.PERCENT && (
                <FormField
                  control={form.control}
                  name="maxDiscount"
                  label="Giảm tối đa (tùy chọn)"
                  description="Chặn trần số tiền giảm cho voucher %, tránh giảm quá lớn ở đơn giá trị cao."
                  render={(f) => (
                    <MoneyInput value={f.value ?? ''} onChange={f.onChange} placeholder="Không giới hạn" />
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="usageLimit"
                  label="Tổng lượt dùng"
                  render={(f) => <Input {...f} placeholder="Không giới hạn" inputMode="numeric" />}
                />
                <FormField
                  control={form.control}
                  name="perCustomerLimit"
                  label="Lượt dùng / khách"
                  render={(f) => <Input {...f} placeholder="Không giới hạn" inputMode="numeric" />}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startsAt"
                  label="Bắt đầu"
                  render={(f) => (
                    <DatePickerField value={f.value} onChange={f.onChange} placeholder="Ngay khi tạo" />
                  )}
                />
                <FormField
                  control={form.control}
                  name="endsAt"
                  label="Kết thúc"
                  render={(f) => (
                    <DatePickerField
                      value={f.value}
                      onChange={f.onChange}
                      placeholder="Không giới hạn"
                      endOfDay
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Combo sản phẩm
                {products.length > 0 && ` (${products.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Bỏ trống = áp dụng cho mọi sản phẩm. Chọn 1 hoặc nhiều sản phẩm để
                giới hạn mã chỉ dùng được khi giỏ hàng có ít nhất 1 trong các sản
                phẩm này.
              </p>
              <FormField
                control={form.control}
                name="products"
                render={(f) => <ProductMultiPicker value={f.value} onChange={f.onChange} />}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isActive"
                render={(f) => (
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Kích hoạt</p>
                      <p className="text-xs text-muted-foreground">
                        Tắt để tạm ngưng mã mà không cần xoá.
                      </p>
                    </div>
                    <Switch checked={f.value} onCheckedChange={f.onChange} />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Chi nhánh áp dụng
                {branches.length > 0 && ` (${branches.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Bỏ trống = áp dụng cho mọi chi nhánh. Chọn 1 = riêng chi nhánh đó;
                chọn nhiều = nhóm chi nhánh.
              </p>
              <FormField
                control={form.control}
                name="branches"
                render={(f) => <BranchMultiSelect value={f.value} onChange={f.onChange} />}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Khách hàng áp dụng
                {customerScope === VoucherCustomerScope.SPECIFIC && customers.length > 0
                  ? ` (${customers.length})`
                  : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {(
                  [
                    {
                      value: VoucherCustomerScope.SPECIFIC,
                      title: 'Chọn khách hàng',
                      desc: 'Giới hạn theo danh sách khách hàng cụ thể bên dưới — bỏ trống danh sách = không giới hạn (áp dụng cho mọi khách).',
                    },
                    {
                      value: VoucherCustomerScope.GUESTS,
                      title: 'Toàn bộ khách vãng lai',
                      desc: 'Chỉ áp dụng cho đơn đặt không đăng nhập tài khoản.',
                    },
                    {
                      value: VoucherCustomerScope.USERS,
                      title: 'Toàn bộ tài khoản',
                      desc: 'Áp dụng cho mọi khách đã đăng nhập, không giới hạn tài khoản cụ thể nào.',
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                      customerScope === opt.value ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                    )}
                  >
                    <input
                      type="radio"
                      name="customerScope"
                      className="mt-1 size-4 shrink-0"
                      checked={customerScope === opt.value}
                      onChange={() => {
                        form.setValue('customerScope', opt.value, { shouldDirty: true });
                        if (opt.value !== VoucherCustomerScope.SPECIFIC) {
                          form.setValue('customers', [], { shouldDirty: true });
                        }
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium">{opt.title}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {customerScope === VoucherCustomerScope.SPECIFIC && (
                <FormField
                  control={form.control}
                  name="customers"
                  render={(f) => <CustomerMultiPicker value={f.value} onChange={f.onChange} />}
                />
              )}
            </CardContent>
          </Card>

        </div>
      </form>
    </Form>
  );
}
