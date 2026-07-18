import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { MoneyInput } from '@/components/shared/money-input';
import { useCreateB2bCustomer } from '../../hooks/use-customer-mutations';

const schema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  lastName: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  companyName: z.string().trim().min(1, 'Nhập tên công ty'),
  taxCode: z.string().trim().min(1, 'Nhập mã số thuế'),
  companyAddress: z.string().trim().optional(),
  creditLimit: z.string().optional(),
  paymentTerms: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  email: '',
  password: '',
  lastName: '',
  firstName: '',
  phone: '',
  companyName: '',
  taxCode: '',
  companyAddress: '',
  creditLimit: '',
  paymentTerms: '',
};

/** Staff-entered B2B account — creates the login + company profile together
 *  (B2B customers don't self-register through this path; a sales rep closes
 *  the deal offline and enters it here). */
export function CreateB2bCustomerDialog() {
  const [open, setOpen] = useState(false);
  const createB2b = useCreateB2bCustomer();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) form.reset(emptyValues);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Tạo khách hàng B2B
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo khách hàng B2B</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) =>
              createB2b.mutate(
                {
                  email: values.email.trim(),
                  password: values.password,
                  ...(values.lastName ? { lastName: values.lastName } : {}),
                  ...(values.firstName ? { firstName: values.firstName } : {}),
                  ...(values.phone ? { phone: values.phone } : {}),
                  companyName: values.companyName.trim(),
                  taxCode: values.taxCode.trim(),
                  ...(values.companyAddress
                    ? { companyAddress: values.companyAddress }
                    : {}),
                  ...(values.creditLimit ? { creditLimit: values.creditLimit } : {}),
                  ...(values.paymentTerms ? { paymentTerms: values.paymentTerms } : {}),
                },
                {
                  onSuccess: () => {
                    setOpen(false);
                    form.reset(emptyValues);
                  },
                },
              ),
            )}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                label="Email đăng nhập"
                render={(f) => <Input {...f} placeholder="Nhập email…" />}
              />
              <FormField
                control={form.control}
                name="password"
                label="Mật khẩu ban đầu"
                render={(f) => (
                  <Input {...f} type="password" placeholder="Nhập mật khẩu…" />
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                label="Họ (tuỳ chọn)"
                render={(f) => <Input {...f} placeholder="Nhập họ…" />}
              />
              <FormField
                control={form.control}
                name="firstName"
                label="Tên (tuỳ chọn)"
                render={(f) => <Input {...f} placeholder="Nhập tên…" />}
              />
              <FormField
                control={form.control}
                name="phone"
                label="Điện thoại (tuỳ chọn)"
                className="sm:col-span-2"
                render={(f) => <Input {...f} placeholder="Nhập số điện thoại…" />}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium">Hồ sơ doanh nghiệp</p>
              <FormField
                control={form.control}
                name="companyName"
                label="Tên công ty"
                render={(f) => <Input {...f} placeholder="Nhập tên công ty…" />}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="taxCode"
                  label="Mã số thuế"
                  render={(f) => <Input {...f} placeholder="Nhập mã số thuế…" />}
                />
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  label="Điều khoản thanh toán (tuỳ chọn)"
                  render={(f) => <Input {...f} placeholder="Vd: NET30…" />}
                />
              </div>
              <FormField
                control={form.control}
                name="companyAddress"
                label="Địa chỉ công ty (tuỳ chọn)"
                render={(f) => <Input {...f} placeholder="Nhập địa chỉ công ty…" />}
              />
              <FormField
                control={form.control}
                name="creditLimit"
                label="Hạn mức công nợ (tuỳ chọn)"
                render={(f) => (
                  <MoneyInput
                    {...f}
                    value={f.value ?? ''}
                    placeholder="Nhập hạn mức công nợ…"
                  />
                )}
              />
            </div>

            <Button type="submit" className="w-full" loading={createB2b.isPending}>
              Tạo khách hàng
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
