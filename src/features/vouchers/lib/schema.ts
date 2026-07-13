import { z } from 'zod';
import { VoucherCustomerScope, VoucherType } from '@/types';
import type {
  UpdateVoucherInput,
  Voucher,
  VoucherBranchRef,
  VoucherCustomerRef,
  VoucherInput,
  VoucherProductRef,
} from '../types';

const optionalDecimal = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Giá trị không hợp lệ')
  .or(z.literal(''))
  .optional();

const optionalInt = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Phải là số nguyên')
  .or(z.literal(''))
  .optional();

export const voucherFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'Nhập mã')
      .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ gồm chữ, số, - và _'),
    type: z.nativeEnum(VoucherType),
    value: z.string().trim().min(1, 'Nhập giá trị'),
    minSubtotal: optionalDecimal,
    maxDiscount: optionalDecimal,
    usageLimit: optionalInt,
    perCustomerLimit: optionalInt,
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    isActive: z.boolean(),
    products: z.array(z.custom<VoucherProductRef>()),
    branches: z.array(z.custom<VoucherBranchRef>()),
    customerScope: z.nativeEnum(VoucherCustomerScope),
    customers: z.array(z.custom<VoucherCustomerRef>()),
    shippingMethods: z.array(z.string()),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.startsAt <= v.endsAt, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endsAt'],
  });

export type VoucherFormValues = z.infer<typeof voucherFormSchema>;

export function emptyVoucherForm(): VoucherFormValues {
  return {
    code: '',
    type: VoucherType.PERCENT,
    value: '',
    minSubtotal: '',
    maxDiscount: '',
    usageLimit: '',
    perCustomerLimit: '',
    startsAt: '',
    endsAt: '',
    isActive: true,
    products: [],
    branches: [],
    customerScope: VoucherCustomerScope.SPECIFIC,
    customers: [],
    shippingMethods: [],
  };
}

export function voucherToForm(v: Voucher): VoucherFormValues {
  return {
    code: v.code,
    type: v.type,
    // BE returns money/percent as a decimal string ("20.00"). Percent + shipping
    // are normalized to a plain number ("0"/"20") so the % Input and the
    // shipping full-free sentinel (value === '0') compare cleanly; fixed keeps
    // its raw decimal for MoneyInput.
    value:
      v.type === VoucherType.PERCENT || v.type === VoucherType.SHIPPING
        ? String(Number(v.value))
        : v.value,
    minSubtotal: v.minSubtotal && Number(v.minSubtotal) > 0 ? v.minSubtotal : '',
    maxDiscount: v.maxDiscount ?? '',
    usageLimit: v.usageLimit != null ? String(v.usageLimit) : '',
    perCustomerLimit: v.perCustomerLimit != null ? String(v.perCustomerLimit) : '',
    startsAt: v.startsAt ?? '',
    endsAt: v.endsAt ?? '',
    isActive: v.isActive,
    products: v.products ?? [],
    branches: v.branches ?? [],
    customerScope: v.customerScope,
    customers: v.customers ?? [],
    shippingMethods: v.shippingMethods ?? [],
  };
}

export function formToCreatePayload(values: VoucherFormValues): VoucherInput {
  return {
    code: values.code.trim().toUpperCase(),
    type: values.type,
    value: values.value.trim(),
    ...(values.minSubtotal ? { minSubtotal: values.minSubtotal.trim() } : {}),
    ...(values.type === VoucherType.PERCENT && values.maxDiscount
      ? { maxDiscount: values.maxDiscount.trim() }
      : {}),
    ...(values.usageLimit ? { usageLimit: Number(values.usageLimit) } : {}),
    ...(values.perCustomerLimit ? { perCustomerLimit: Number(values.perCustomerLimit) } : {}),
    ...(values.startsAt ? { startsAt: values.startsAt } : {}),
    ...(values.endsAt ? { endsAt: values.endsAt } : {}),
    isActive: values.isActive,
    productIds: values.products.map((p) => p.id),
    branchIds: values.branches.map((b) => b.id),
    customerScope: values.customerScope,
    // Only meaningful for 'specific' — the form clears `customers` when the
    // admin switches to 'guests'/'users' (see VoucherForm), so this is
    // already [] in those modes and doesn't need a re-check here.
    customerIds: values.customers.map((c) => c.id),
    // Only meaningful for SHIPPING; the form keeps it [] for other types.
    shippingMethods:
      values.type === VoucherType.SHIPPING ? values.shippingMethods : [],
  };
}

export function formToUpdatePayload(values: VoucherFormValues): UpdateVoucherInput {
  // Update reuses the create mapping — every field (incl. the 3 scoping
  // arrays) is always sent, since PATCH here means "replace with this set"
  // for the scoping relations specifically (see VouchersService.update).
  return formToCreatePayload(values);
}
