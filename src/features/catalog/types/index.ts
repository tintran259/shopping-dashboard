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

// ── Read shapes (storefront/FE-shaped DTOs returned by the BE) ──────
export interface ImageRef {
  url: string;
  alt: string;
}

export interface PriceRef {
  amount: number;
  compareAt: number | null;
  currency: string;
}

export interface BranchStockRef {
  branchId: string;
  inStock: boolean;
  quantity: number;
}

/** Item shape of `GET /products` (`items[]`). */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  thumbnail: ImageRef;
  defaultVariantId: string | null;
  price: PriceRef;
  priceVaries: boolean;
  brand: { id: string; slug: string; name: string } | null;
  rating?: { average: number; count: number };
  flags: Record<string, boolean>;
  inStock: boolean;
  branchStock: BranchStockRef[];
  status: ProductStatus;
}

export interface ProductVariantDetail {
  id: string;
  sku: string;
  options: Record<string, string>;
  price: PriceRef;
  stock: number;
  branchStock: BranchStockRef[];
  image?: ImageRef;
}

export interface ProductOptionDetail {
  id: string;
  name: string;
  displayType: OptionDisplayType;
  values: string[];
}

/** Shape of `GET /products/:id` (ProductDto). */
export interface ProductDetail extends Omit<ProductSummary, 'thumbnail'> {
  sku: string;
  images: ImageRef[];
  shortDescription?: string;
  description?: string;
  attributes: {
    key: string;
    label: string;
    value: string | string[];
    group?: string;
  }[];
  options: ProductOptionDetail[];
  variants: ProductVariantDetail[];
  categories: { id: string; slug: string; name: string }[];
  currency: string;
}

/** Envelope of `GET /products` — NOT the generic {data,meta} envelope. */
export interface ProductListResponse {
  items: ProductSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  facets: unknown[];
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
