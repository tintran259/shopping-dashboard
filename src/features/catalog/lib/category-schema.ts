import { z } from 'zod';
import type { Category } from '../types';

/** Giá trị "không có cha" trong Select (RHF không nhận `null`/`undefined` làm value). */
export const NO_PARENT = '__root__';

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug không hợp lệ'),
  description: z.string().trim().optional(),
  imageUrl: z.string().optional(),
  parentId: z.string(),
  isActive: z.boolean(),
  metaTitle: z.string().trim().max(70, 'Tối đa 70 ký tự').optional(),
  metaDescription: z.string().trim().max(160, 'Tối đa 160 ký tự').optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export type CategoryDialogTarget =
  | { mode: 'create'; parentId?: string }
  | { mode: 'edit'; category: Category };
