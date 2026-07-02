/** Single source of truth for BO route paths. */
export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  orders: '/orders',
  orderDetail: (id = ':id') => `/orders/${id}`,
  products: '/catalog/products',
  productNew: '/catalog/products/new',
  productEdit: (id = ':id') => `/catalog/products/${id}`,
  categories: '/catalog/categories',
  brands: '/catalog/brands',
  branches: '/inventory/branches',
  inventory: '/inventory/stock',
  vouchers: '/vouchers',
  customers: '/customers',
  reviews: '/reviews',
  locations: '/locations',
} as const;
