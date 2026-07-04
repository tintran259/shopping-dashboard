import { z } from 'zod';
import { FulfillmentType, PaymentMethodCode } from '@/types';
import type { CreateOrderInput } from '../types';

const optionalDecimal = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Giá trị không hợp lệ')
  .or(z.literal(''))
  .optional();

/** One picked variant line — display fields (productName/variantTitle/sku/price)
 *  are for the on-screen preview only; only variantId + quantity are sent to the BE. */
const orderItemSchema = z.object({
  variantId: z.string(),
  productName: z.string(),
  variantTitle: z.string(),
  sku: z.string(),
  price: z.string(),
  quantity: z.number().int().min(1),
});

export const orderFormSchema = z
  .object({
    branchId: z.string().min(1, 'Chọn chi nhánh'),
    fulfillment: z.nativeEnum(FulfillmentType),
    paymentMethodCode: z.nativeEnum(PaymentMethodCode),
    recipientName: z.string().trim().min(1, 'Nhập tên người nhận'),
    recipientPhone: z.string().trim().min(1, 'Nhập số điện thoại'),
    recipientEmail: z
      .string()
      .trim()
      .email('Email không hợp lệ')
      .or(z.literal(''))
      .optional(),
    provinceCode: z.number().optional(),
    wardCode: z.number().optional(),
    street: z.string().trim().optional(),
    items: z.array(orderItemSchema).min(1, 'Thêm ít nhất 1 sản phẩm'),
    voucherCode: z.string().trim().optional(),
    shippingFee: optionalDecimal,
    notes: z.string().trim().optional(),
    wantInvoice: z.boolean(),
    invoiceCompanyName: z.string().trim().optional(),
    invoiceTaxCode: z.string().trim().optional(),
    invoiceAddress: z.string().trim().optional(),
    invoiceEmail: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.fulfillment === FulfillmentType.DELIVERY) {
      if (!values.provinceCode) {
        ctx.addIssue({
          code: 'custom',
          path: ['provinceCode'],
          message: 'Chọn tỉnh/thành',
        });
      }
      if (!values.wardCode) {
        ctx.addIssue({
          code: 'custom',
          path: ['wardCode'],
          message: 'Chọn phường/xã',
        });
      }
      if (!values.street?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['street'],
          message: 'Nhập địa chỉ cụ thể',
        });
      }
    }
    if (values.wantInvoice) {
      if (!values.invoiceCompanyName?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['invoiceCompanyName'],
          message: 'Nhập tên công ty',
        });
      }
      if (!values.invoiceTaxCode?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['invoiceTaxCode'],
          message: 'Nhập mã số thuế',
        });
      }
      if (!values.invoiceAddress?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['invoiceAddress'],
          message: 'Nhập địa chỉ công ty',
        });
      }
      if (!values.invoiceEmail?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['invoiceEmail'],
          message: 'Nhập email nhận hóa đơn',
        });
      }
    }
  });

export type OrderFormValues = z.infer<typeof orderFormSchema>;
export type OrderItemFormValue = OrderFormValues['items'][number];

export function emptyOrderForm(): OrderFormValues {
  return {
    branchId: '',
    fulfillment: FulfillmentType.DELIVERY,
    paymentMethodCode: PaymentMethodCode.COD,
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    provinceCode: undefined,
    wardCode: undefined,
    street: '',
    items: [],
    voucherCode: '',
    shippingFee: '0',
    notes: '',
    wantInvoice: false,
    invoiceCompanyName: '',
    invoiceTaxCode: '',
    invoiceAddress: '',
    invoiceEmail: '',
  };
}

/** Map form values → the BE create-order DTO. BE recomputes price/subtotal/stock
 *  itself (golden rule) — only variantId + quantity are sent per item. */
export function formToCreateOrderInput(values: OrderFormValues): CreateOrderInput {
  return {
    branchId: values.branchId,
    fulfillment: values.fulfillment,
    paymentMethodCode: values.paymentMethodCode,
    recipientName: values.recipientName.trim(),
    recipientPhone: values.recipientPhone.trim(),
    ...(values.recipientEmail
      ? { recipientEmail: values.recipientEmail.trim() }
      : {}),
    ...(values.fulfillment === FulfillmentType.DELIVERY
      ? {
          shippingAddress: {
            recipientName: values.recipientName.trim(),
            phone: values.recipientPhone.trim(),
            provinceCode: values.provinceCode as number,
            wardCode: values.wardCode as number,
            street: (values.street ?? '').trim(),
          },
        }
      : {}),
    ...(values.voucherCode ? { voucherCode: values.voucherCode.trim() } : {}),
    ...(values.shippingFee ? { shippingFee: values.shippingFee } : {}),
    ...(values.notes ? { notes: values.notes.trim() } : {}),
    ...(values.wantInvoice
      ? {
          invoice: {
            companyName: (values.invoiceCompanyName ?? '').trim(),
            taxCode: (values.invoiceTaxCode ?? '').trim(),
            address: (values.invoiceAddress ?? '').trim(),
            email: (values.invoiceEmail ?? '').trim(),
          },
        }
      : {}),
    items: values.items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
    })),
  };
}
