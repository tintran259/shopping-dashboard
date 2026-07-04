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

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: string;
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
  categoryIds?: string[];
  images?: ProductImageInput[];
  options?: ProductOptionInput[];
  variants?: VariantInput[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ProductListParams extends PaginationParams {
  status?: ProductStatus;
  category?: string;
  brand?: string[];
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
