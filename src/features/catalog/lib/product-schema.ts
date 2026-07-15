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

/** A declared option dimension (vd "Màu sắc") + its tag values (vd Trắng/Đen/Đỏ).
 *  Values only — variants are generated from the combination of all options.
 *  `key` is a client-only stable id (never sent to the BE) so that renaming
 *  an option doesn't break variant matching — see {@link generateVariants}. */
const productOptionSchema = z.object({
  key: z.string(),
  name: z.string().trim().min(1, 'Nhập tên tùy chọn'),
  values: z.array(z.string()).min(1, 'Thêm ít nhất 1 giá trị'),
});

/** One generated (or manually re-synced) SKU — `optionValues` maps each
 *  option's stable `key` (not its name — a name can be edited later) to this
 *  variant's value for that dimension. Translated to `{ optionName: value }`
 *  only at submit time in {@link formToPayload}, which is the shape the BE
 *  expects. */
const weightGramString = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Cân nặng phải là số nguyên (gram)')
  .or(z.literal(''))
  .optional();

const flatVariantSchema = z.object({
  /** Existing variant id (edit flow) — undefined for a variant not yet saved. */
  id: z.string().optional(),
  sku: z.string().trim().min(1, 'Nhập SKU'),
  price: decimalString,
  compareAtPrice: optionalDecimal,
  imageUrl: z.string().optional(),
  /** Gram — dùng để tính tổng cân nặng đơn hàng cho API đơn vị vận chuyển
   *  (vd GHN). Bỏ trống = dùng cân nặng mặc định tạm thời phía BE. */
  weightGram: weightGramString,
  optionValues: z.record(z.string(), z.string()),
});

export const productFormSchema = z
  .object({
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
    /** Hạn sử dụng (YYYY-MM-DD). '' = vô thời hạn. */
    expiryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ')
      .or(z.literal(''))
      .optional(),
    shortDescription: z.string().trim().optional(),
    description: z.string().trim().optional(),
    categoryIds: z.array(z.string()),
    /** Ảnh đại diện (isPrimary) — URL trả về từ /admin/uploads. '' = chưa có. */
    thumbnail: z.string(),
    /** Thư viện ảnh phụ (không gồm thumbnail). */
    gallery: z.array(z.string()),
    /** Sản phẩm chỉ 1 loại (không tuỳ chọn) → dùng đúng 1 SKU này thay vì bảng biến thể. */
    hasVariants: z.boolean(),
    singleSku: z.string().trim().optional(),
    singleWeightGram: weightGramString,
    options: z.array(productOptionSchema),
    variants: z.array(flatVariantSchema),
  })
  .superRefine((values, ctx) => {
    if (values.hasVariants) {
      if (values.options.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'Thêm ít nhất 1 tùy chọn',
        });
      }
      const expected = values.options.reduce((n, o) => n * (o.values.length || 0), 1);
      if (values.variants.length === 0 || values.variants.length !== expected) {
        ctx.addIssue({
          code: 'custom',
          path: ['variants'],
          message:
            'Danh sách biến thể chưa khớp với tùy chọn — bấm "Tạo biến thể"/"Tạo lại" trước khi lưu.',
        });
      }
    } else if (!values.singleSku?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['singleSku'],
        message: 'Nhập mã SKU',
      });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductOptionFormValue = ProductFormValues['options'][number];
export type FlatVariantFormValue = ProductFormValues['variants'][number];

const NO_BRAND = '__none__';
export { NO_BRAND };

/** Setting either status forces every branch's stock to 0/out_of_stock
 *  BE-side and blocks further inventory edits until the product moves out of
 *  this set — see `StatusChangeConfirmDialog` and the Inventory page's lock. */
export const LOCKED_INVENTORY_STATUSES: ProductStatus[] = [
  ProductStatus.OUT_OF_STOCK,
  ProductStatus.DISCONTINUED,
];

/** "Trà Ô Long 500g" → "tra-o-long-500g" (bỏ dấu tiếng Việt, kebab-case). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "Trắng" → "TRANG" (bỏ dấu, viết hoa, chỉ chữ+số) — dùng để tự sinh SKU. */
function skuToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** "tra-o-long-500g" → "TRA-O-LONG-500G" — SKU luôn tự sinh từ slug (không
 *  cho nhập tay) vì slug đã được BE đảm bảo duy nhất trên toàn hệ thống, nên
 *  SKU suy từ đó gần như không thể đụng hàng với sản phẩm khác. */
export function skuPrefixFromSlug(slug: string): string {
  return slug.toUpperCase() || 'SP';
}

/** VND không có đơn vị lẻ dưới 1.000 trên thực tế — làm tròn tới nghìn gần
 *  nhất (vd 166.667 → 167.000) thay vì để nguyên số lẻ từ phép chia %. */
export function roundToVnd(value: number): number {
  return Math.round(value / 1000) * 1000;
}

/** "Trắng / S" — nhãn hiển thị của 1 tổ hợp giá trị tuỳ chọn, theo đúng thứ tự
 *  các tuỳ chọn đã khai báo. Đọc theo `key` (ổn định), không theo `name` (có
 *  thể đã bị đổi) — xem {@link generateVariants}. */
export function variantComboLabel(
  options: ProductOptionFormValue[],
  optionValues: Record<string, string>,
): string {
  return options
    .map((o) => optionValues[o.key])
    .filter((v): v is string => !!v)
    .join(' / ');
}

/** Tích Descartes của các giá trị tuỳ chọn — mỗi phần tử là 1 tổ hợp đầy đủ,
 *  key theo `option.key` (ổn định qua các lần đổi tên). */
function cartesianProduct(
  options: ProductOptionFormValue[],
): Record<string, string>[] {
  return options.reduce<Record<string, string>[]>(
    (combos, option) =>
      combos.flatMap((combo) =>
        option.values.map((value) => ({ ...combo, [option.key]: value })),
      ),
    [{}],
  );
}

/** "Tạo biến thể"/"Tạo lại": sinh lại danh sách biến thể theo tích Descartes của
 *  các tuỳ chọn hiện tại. Tổ hợp nào đã tồn tại (khớp theo optionValues, theo
 *  `key` ổn định — nên đổi TÊN tuỳ chọn không làm mất dữ liệu đã sửa) thì giữ
 *  nguyên id/SKU/giá/ảnh đã nhập; tổ hợp mới thì tự sinh SKU + lấy giá cơ bản
 *  làm giá mặc định; tổ hợp không còn khai báo thì bị loại (BE sẽ xoá biến thể
 *  tương ứng khi lưu, xem `syncOptionsAndVariants`). */
export function generateVariants(
  options: ProductOptionFormValue[],
  existing: FlatVariantFormValue[],
  slug: string,
  basePrice: string,
): FlatVariantFormValue[] {
  const combos = cartesianProduct(options);
  const prefix = skuPrefixFromSlug(slug);

  return combos.map((combo) => {
    const match = existing.find((v) =>
      Object.entries(combo).every(([k, val]) => v.optionValues[k] === val),
    );
    if (match) return match;
    return {
      sku: [prefix, ...Object.values(combo).map(skuToken)].join('-'),
      price: basePrice || '',
      compareAtPrice: '',
      imageUrl: '',
      weightGram: '',
      optionValues: combo,
    };
  });
}

/** Random-enough client-only id — never sent to the BE, only used to keep a
 *  form-session's option rows addressable across renames. */
function randomKey(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** A fresh blank option row — exported so the toggle-on handler can seed the
 *  first "Tùy chọn 1" card without pre-populating an invalid placeholder that
 *  would fail validation while `hasVariants` is off and the field is hidden. */
export function emptyOption(): ProductOptionFormValue {
  return { key: randomKey(), name: '', values: [] };
}

/** Empty form for the create flow. */
export function emptyProductForm(): ProductFormValues {
  return {
    name: '',
    slug: '',
    status: ProductStatus.DRAFT,
    brandId: NO_BRAND,
    basePrice: '',
    compareAtPrice: '',
    expiryDate: '',
    shortDescription: '',
    description: '',
    categoryIds: [],
    thumbnail: '',
    gallery: [],
    hasVariants: false,
    singleSku: '',
    singleWeightGram: '',
    // Trống — chỉ khởi tạo 1 nhóm tùy chọn rỗng khi admin thật sự bật công tắc
    // "có nhiều tùy chọn" (xem ProductOptionsAndVariants); để sẵn 1 placeholder
    // ở đây sẽ luôn fail validation của chính nó dù công tắc đang tắt và ẩn.
    options: [],
    variants: [],
  };
}

/** Map a fetched raw Product entity → editable form values. */
export function productToForm(p: Product): ProductFormValues {
  const declaredOptions = p.options ?? [];
  const hasVariants = declaredOptions.length > 0;

  // Fresh client-only keys for this edit session — decouples variant matching
  // from the option's (editable) name. Which Option (by value id) each
  // declared value belongs to, to rebuild each variant's
  // `optionValues: { [optionKey]: value }`.
  const optionByValueId = new Map<string, { key: string; value: string }>();
  const options: ProductOptionFormValue[] = hasVariants
    ? declaredOptions.map((o) => {
        const key = randomKey();
        for (const v of o.values ?? []) {
          optionByValueId.set(v.id, { key, value: v.value });
        }
        return { key, name: o.name, values: (o.values ?? []).map((v) => v.value) };
      })
    : [];

  const variants: FlatVariantFormValue[] = (p.variants ?? []).map((v) => {
    const optionValues: Record<string, string> = {};
    for (const ov of v.optionValues ?? []) {
      const entry = optionByValueId.get(ov.id);
      if (entry) optionValues[entry.key] = entry.value;
    }
    return {
      id: v.id,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice ?? '',
      imageUrl: v.imageUrl ?? '',
      weightGram: v.weightGram != null ? String(v.weightGram) : '',
      optionValues,
    };
  });

  return {
    name: p.name,
    slug: p.slug,
    status: p.status,
    brandId: p.brandId ?? p.brand?.id ?? NO_BRAND,
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice ?? '',
    // BE trả `date` dạng 'YYYY-MM-DD' (cắt phần giờ nếu có) — '' = vô thời hạn.
    expiryDate: (p.expiryDate ?? '').slice(0, 10),
    shortDescription: p.shortDescription ?? '',
    description: p.description ?? '',
    categoryIds: (p.categories ?? []).map((c) => c.id),
    // Ảnh isPrimary (hoặc ảnh đầu tiên) → thumbnail; còn lại → gallery.
    thumbnail:
      (p.images ?? []).find((img) => img.isPrimary)?.url ??
      p.images?.[0]?.url ??
      '',
    gallery: (p.images ?? [])
      .filter(
        (img, _, all) =>
          img.url !== ((all.find((i) => i.isPrimary) ?? all[0])?.url ?? ''),
      )
      .map((img) => img.url),
    hasVariants,
    singleSku: hasVariants ? '' : (variants[0]?.sku ?? ''),
    singleWeightGram: hasVariants ? '' : (variants[0]?.weightGram ?? ''),
    options,
    // Luôn giữ `variants` kể cả khi !hasVariants — đây là chỗ duy nhất mang
    // theo `id` của biến thể đơn (singleSku), formToPayload() đọc lại id đó
    // từ variants[0]. Từng bỏ trống mảng này khi !hasVariants, khiến mọi lần
    // lưu sản phẩm 1-SKU (kể cả chỉ đổi status) gửi lên KHÔNG id → BE tưởng
    // là biến thể mới, insert trùng SKU với chính biến thể cũ trước khi kịp
    // xoá → lỗi 409 trùng SKU giả.
    variants,
  };
}

/** Map form values → the BE Create/Update DTO (drops empty optionals). Sản
 *  phẩm 1 loại (không tuỳ chọn) → gửi đúng 1 biến thể dùng `singleSku` + giá
 *  cơ bản, không kèm `options`. */
export function formToPayload(values: ProductFormValues): CreateProductInput {
  const options: ProductOptionInput[] = values.hasVariants
    ? values.options.map((o) => ({
        name: o.name.trim(),
        displayType: OptionDisplayType.PILL,
        values: o.values,
      }))
    : [];

  // Form state keys `optionValues` by each option's stable client-only `key`
  // (survives renames) — the BE expects `{ optionName: value }`, so translate
  // at the boundary here, right before sending.
  const nameByKey = new Map(values.options.map((o) => [o.key, o.name.trim()]));

  const variants: VariantInput[] = values.hasVariants
    ? values.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        sku: v.sku.trim(),
        price: v.price.trim(),
        ...(v.compareAtPrice ? { compareAtPrice: v.compareAtPrice.trim() } : {}),
        ...(v.imageUrl ? { imageUrl: v.imageUrl.trim() } : {}),
        ...(v.weightGram ? { weightGram: Number(v.weightGram) } : {}),
        optionValues: Object.fromEntries(
          Object.entries(v.optionValues).map(([key, val]) => [
            nameByKey.get(key) ?? key,
            val,
          ]),
        ),
      }))
    : [
        {
          ...(values.variants[0]?.id ? { id: values.variants[0].id } : {}),
          sku: (values.singleSku ?? '').trim(),
          price: values.basePrice.trim(),
          ...(values.compareAtPrice
            ? { compareAtPrice: values.compareAtPrice.trim() }
            : {}),
          ...(values.thumbnail ? { imageUrl: values.thumbnail.trim() } : {}),
          ...(values.singleWeightGram
            ? { weightGram: Number(values.singleWeightGram) }
            : {}),
        },
      ];

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
    // Luôn gửi (kể cả null) để khi admin xoá HSD ở form edit thì BE cũng xoá —
    // omit sẽ bị hiểu là "giữ nguyên". '' = vô thời hạn → null.
    expiryDate: values.expiryDate?.trim() ? values.expiryDate.trim() : null,
    ...(values.shortDescription
      ? { shortDescription: values.shortDescription.trim() }
      : {}),
    ...(values.description ? { description: values.description.trim() } : {}),
    ...(values.categoryIds.length ? { categoryIds: values.categoryIds } : {}),
    // Thumbnail = ảnh isPrimary đứng đầu; gallery theo sau. BE giữ nguyên thứ tự.
    ...(values.thumbnail || values.gallery.length
      ? {
          images: [
            ...(values.thumbnail
              ? [{ url: values.thumbnail, isPrimary: true }]
              : []),
            ...values.gallery.map((url) => ({ url, isPrimary: false })),
          ],
        }
      : {}),
    // Luôn gửi options/variants — update() BE coi field có mặt là "thay thế
    // toàn bộ", vắng mặt là "giữ nguyên" (xem products.service.ts).
    options,
    variants,
  };
}
