import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { useUpdateCustomer } from '../../hooks/use-customer-mutations';
import type { Customer } from '../../types';

const schema = z.object({
  lastName: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s().-]*$/, 'Số điện thoại không hợp lệ')
    .optional(),
});
type FormValues = z.infer<typeof schema>;

export function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateCustomer(customer.id);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { lastName: '', firstName: '', phone: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        lastName: customer.lastName ?? '',
        firstName: customer.firstName ?? '',
        phone: customer.phone ?? '',
      });
    }
  }, [open, customer, form]);

  const onSubmit = (values: FormValues) =>
    update.mutate(values, { onSuccess: () => onOpenChange(false) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa thông tin khách hàng</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="edit-customer-form"
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="lastName"
                label="Họ"
                render={(f) => <Input {...f} placeholder="Nguyễn" />}
              />
              <FormField
                control={form.control}
                name="firstName"
                label="Tên"
                render={(f) => <Input {...f} placeholder="An" />}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              label="Điện thoại"
              render={(f) => <Input {...f} placeholder="09xx xxx xxx" />}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="edit-customer-form"
            loading={update.isPending}
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
