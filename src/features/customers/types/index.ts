import type {
  BaseEntity,
  CustomerStatus,
  CustomerType,
  PaginationParams,
} from '@/types';

/** Columns the admin customer list can be sorted by (must match BE allowlist). */
export type CustomerSortField = 'createdAt' | 'email' | 'lastName';

/** Query params for GET /admin/customers (server-side filter/sort/paginate). */
export interface AdminCustomerListParams extends PaginationParams {
  type?: CustomerType;
  status?: CustomerStatus;
  sortBy?: CustomerSortField;
  sortOrder?: 'ASC' | 'DESC';
}

export interface B2bProfile extends BaseEntity {
  companyName: string;
  taxCode: string;
  companyAddress?: string;
  priceTierId?: string;
  creditLimit: string;
  paymentTerms?: string;
}

export interface Address extends BaseEntity {
  customerId: string;
  label?: string;
  recipientName: string;
  phone: string;
  provinceCode: number;
  provinceName: string;
  wardCode: number;
  wardName: string;
  street: string;
  isDefault: boolean;
}

export interface Customer extends BaseEntity {
  email?: string;
  phone?: string;
  type: CustomerType;
  firstName?: string;
  lastName?: string;
  status: CustomerStatus;
  defaultBranchId?: string;
  b2bProfile?: B2bProfile;
  /** Only present on the admin detail view (GET /admin/customers/:id). */
  addresses?: Address[];
}

/** Sửa hồ sơ khách (PATCH /admin/customers/:id) — chỉ các trường cơ bản. */
export interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/** Staff-entered B2B account (POST /admin/customers/b2b) — creates the login
 *  + company profile together; unlike self-registration, the company details
 *  are required up front. */
export interface CreateB2bCustomerInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName: string;
  taxCode: string;
  companyAddress?: string;
  creditLimit?: string;
  paymentTerms?: string;
}
