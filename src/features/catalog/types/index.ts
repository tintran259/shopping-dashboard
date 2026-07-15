import type {
  BaseEntity,
  OptionDisplayType,
  PaginationParams,
  ProductStatus,
} from '@/types';

export interface Brand extends BaseEntity {
  slug: string;
  name: string;
  logoUrl?: string;
}

export interface CategorySeo {
  metaTitle?: string;
  metaDescription?: string;
}

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: string;
  seo?: CategorySeo;
  /** Products directly tagged to this exact category — 0 for non-leaf nodes
   *  (products only ever attach to leaves). The list page rolls this up
   *  across a subtree client-side for a non-leaf category's displayed total. */
  productsCount?: number;
}

/** Kept in sync with the BE's `CategoryAttributeType` enum. */
export type CategoryAttributeType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean';

/** A filter *definition* for a (leaf) category — e.g. "Size" is a SELECT with
 *  options S/M/L. Template only, no product value attached — see
 *  `ProductAttribute` (unrelated, free-form key/value already filled in per
 *  product) for that. */
export interface CategoryAttribute extends BaseEntity {
  categoryId: string;
  name: string;
  type: CategoryAttributeType;
  options?: string[];
  isRequired: boolean;
  sortOrder: number;
}

// ── Raw entity shapes (returned by /admin/products) ─────────────────
export interface ProductImage extends BaseEntity {
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductOptionValue extends BaseEntity {
  value: string;
  sortOrder: number;
}

export interface ProductOption extends BaseEntity {
  name: string;
  displayType: OptionDisplayType;
  sortOrder: number;
  values: ProductOptionValue[];
}

export interface ProductVariant extends BaseEntity {
  sku: string;
  price: string;
  compareAtPrice?: string;
  imageUrl?: string;
  isActive: boolean;
  /** Used to compute total shipment weight for carrier APIs (e.g. GHN). */
  weightGram?: number;
  /** The option values that define this variant (ids map into product.options). */
  optionValues?: ProductOptionValue[];
}

/** Raw product entity (both list rows and detail come in this shape). */
export interface Product extends BaseEntity {
  slug: string;
  name: string;
  status: ProductStatus;
  brandId?: string;
  brand?: Brand;
  shortDescription?: string;
  description?: string;
  basePrice: string;
  compareAtPrice?: string;
  currency?: string;
  /** Hạn sử dụng (YYYY-MM-DD). Null/absent = vô thời hạn. */
  expiryDate?: string | null;
  images?: ProductImage[];
  options?: ProductOption[];
  variants?: ProductVariant[];
  categories?: Category[];
}

// ── Write DTOs (mirror BE Create/Update product DTO) ────────────────
export interface ProductImageInput {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface ProductOptionInput {
  name: string;
  displayType: OptionDisplayType;
  values: string[];
}

export interface VariantInput {
  /** Existing variant id (update path only) — omit for a new variant. */
  id?: string;
  sku: string;
  price: string;
  compareAtPrice?: string;
  imageUrl?: string;
  weightGram?: number;
  optionValues?: Record<string, string>;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  status?: ProductStatus;
  brandId?: string;
  basePrice: string;
  compareAtPrice?: string;
  /** Hạn sử dụng (YYYY-MM-DD). null = xoá/vô thời hạn (gửi null để BE clear khi
   *  sửa; bỏ trống ở form = null). */
  expiryDate?: string | null;
  categoryIds?: string[];
  images?: ProductImageInput[];
  options?: ProductOptionInput[];
  variants?: VariantInput[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

/** Lọc theo hạn dùng (khớp BE `expiryState`). */
export type ProductExpiryState = 'valid' | 'expiring' | 'expired' | 'none';

export interface ProductListParams extends PaginationParams {
  status?: ProductStatus;
  category?: string;
  brand?: string[];
  expiryState?: ProductExpiryState;
  expiringInDays?: number;
  /** "field:DIR" e.g. "createdAt:DESC". */
  sort?: string;
}

/** Stock for one branch summed across every variant of a product — used by
 *  the confirm dialog before switching a product to out_of_stock/discontinued. */
export interface ProductInventorySummaryRow {
  branchId: string;
  branchName: string;
  quantity: number;
  reserved: number;
}
