import { z } from 'zod';
import { OptionDisplayType, ProductStatus } from '@/types';
import type {
  CreateProductInput,
  Product,
  ProductOptionInput,
  VariantInput,
} from '../types';

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Giá phải là số (vd 199000 hoặc 199000.00)');

const optionalDecimal = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Giá không hợp lệ')
  .or(z.literal(''))
  .optional();

const optionValuePairSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên tùy chọn'),
  value: z.string().trim().min(1, 'Nhập giá trị'),
});

const variantSchema = z.object({
  sku: z.string().trim().min(1, 'Nhập SKU'),
  price: decimalString,
  compareAtPrice: optionalDecimal,
  imageUrl: z.string().trim().url('URL ảnh không hợp lệ').or(z.literal('')).optional(),
  optionValues: z.array(optionValuePairSchema),
});

const optionSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên tùy chọn'),
  displayType: z.nativeEnum(OptionDisplayType),
  values: z.string().trim().min(1, 'Nhập ít nhất 1 giá trị (phân tách bằng dấu phẩy)'),
});

const imageSchema = z.object({
  url: z.string().trim().url('URL ảnh không hợp lệ'),
  alt: z.string().trim().optional(),
  isPrimary: z.boolean(),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên sản phẩm'),
  slug: z
    .string()
    .trim()
    .min(1, 'Nhập slug')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu -'),
  status: z.nativeEnum(ProductStatus),
  brandId: z.string().optional(),
  basePrice: decimalString,
  compareAtPrice: optionalDecimal,
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  categoryIds: z.array(z.string()),
  images: z.array(imageSchema),
  options: z.array(optionSchema),
  variants: z.array(variantSchema).min(1, 'Sản phẩm cần ít nhất 1 biến thể'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

const NO_BRAND = '__none__';
export { NO_BRAND };

/** Empty form for the create flow. */
export function emptyProductForm(): ProductFormValues {
  return {
    name: '',
    slug: '',
    status: ProductStatus.DRAFT,
    brandId: NO_BRAND,
    basePrice: '',
    compareAtPrice: '',
    shortDescription: '',
    description: '',
    categoryIds: [],
    images: [],
    options: [],
    variants: [
      { sku: '', price: '', compareAtPrice: '', imageUrl: '', optionValues: [] },
    ],
  };
}

/** Map a fetched raw Product entity → editable form values. */
export function productToForm(p: Product): ProductFormValues {
  // valueId → its option name, to rebuild each variant's {name, value} pairs.
  const valueOption = new Map<string, string>();
  for (const o of p.options ?? []) {
    for (const v of o.values ?? []) valueOption.set(v.id, o.name);
  }

  return {
    name: p.name,
    slug: p.slug,
    status: p.status,
    brandId: p.brandId ?? p.brand?.id ?? NO_BRAND,
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice ?? '',
    shortDescription: p.shortDescription ?? '',
    description: p.description ?? '',
    categoryIds: (p.categories ?? []).map((c) => c.id),
    images: (p.images ?? []).map((img) => ({
      url: img.url,
      alt: img.alt ?? '',
      isPrimary: img.isPrimary,
    })),
    options: (p.options ?? []).map((o) => ({
      name: o.name,
      displayType: o.displayType,
      values: (o.values ?? []).map((v) => v.value).join(', '),
    })),
    variants: (p.variants ?? []).map((v) => ({
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice ?? '',
      imageUrl: v.imageUrl ?? '',
      optionValues: (v.optionValues ?? []).map((ov) => ({
        name: valueOption.get(ov.id) ?? '',
        value: ov.value,
      })),
    })),
  };
}

/** Map form values → the BE Create/Update DTO (drops empty optionals). */
export function formToPayload(values: ProductFormValues): CreateProductInput {
  const options: ProductOptionInput[] = values.options.map((o) => ({
    name: o.name.trim(),
    displayType: o.displayType,
    values: o.values
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  }));

  const variants: VariantInput[] = values.variants.map((v) => {
    const optionValues = Object.fromEntries(
      v.optionValues.map((pair) => [pair.name.trim(), pair.value.trim()]),
    );
    return {
      sku: v.sku.trim(),
      price: v.price.trim(),
      ...(v.compareAtPrice ? { compareAtPrice: v.compareAtPrice.trim() } : {}),
      ...(v.imageUrl ? { imageUrl: v.imageUrl.trim() } : {}),
      ...(Object.keys(optionValues).length ? { optionValues } : {}),
    };
  });

  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    status: values.status,
    ...(values.brandId && values.brandId !== NO_BRAND
      ? { brandId: values.brandId }
      : {}),
    basePrice: values.basePrice.trim(),
    ...(values.compareAtPrice
      ? { compareAtPrice: values.compareAtPrice.trim() }
      : {}),
    ...(values.shortDescription
      ? { shortDescription: values.shortDescription.trim() }
      : {}),
    ...(values.description ? { description: values.description.trim() } : {}),
    ...(values.categoryIds.length ? { categoryIds: values.categoryIds } : {}),
    ...(values.images.length
      ? {
          images: values.images.map((img) => ({
            url: img.url.trim(),
            ...(img.alt ? { alt: img.alt.trim() } : {}),
            isPrimary: img.isPrimary,
          })),
        }
      : {}),
    ...(options.length ? { options } : {}),
    ...(variants.length ? { variants } : {}),
  };
}
