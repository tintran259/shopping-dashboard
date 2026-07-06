import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth';
import { DashboardLayout } from '@/app/layouts/dashboard-layout';
import { ProtectedRoute } from '@/app/components/protected-route';
import { NotFoundPage } from '@/app/components/not-found-page';
import { ROUTES } from './routes';

/**
 * Every page behind the login is lazy-loaded so each feature ships as its own
 * chunk (recharts/react-day-picker only load with the Dashboard, the product
 * form only with Catalog…). The Suspense boundary lives in DashboardLayout
 * around the Outlet. Login stays eager — it's the first paint for signed-out
 * users.
 */
const DashboardPage = lazy(() =>
  import('@/features/dashboard').then((m) => ({ default: m.DashboardPage })),
);
const OrdersPage = lazy(() =>
  import('@/features/orders').then((m) => ({ default: m.OrdersPage })),
);
const OrderDetailPage = lazy(() =>
  import('@/features/orders').then((m) => ({ default: m.OrderDetailPage })),
);
const OrderCreatePage = lazy(() =>
  import('@/features/orders').then((m) => ({ default: m.OrderCreatePage })),
);
const ProductsPage = lazy(() =>
  import('@/features/catalog').then((m) => ({ default: m.ProductsPage })),
);
const ProductCreatePage = lazy(() =>
  import('@/features/catalog').then((m) => ({ default: m.ProductCreatePage })),
);
const ProductEditPage = lazy(() =>
  import('@/features/catalog').then((m) => ({ default: m.ProductEditPage })),
);
const CategoriesPage = lazy(() =>
  import('@/features/catalog').then((m) => ({ default: m.CategoriesPage })),
);
const BrandsPage = lazy(() =>
  import('@/features/catalog').then((m) => ({ default: m.BrandsPage })),
);
const BranchesPage = lazy(() =>
  import('@/features/inventory').then((m) => ({ default: m.BranchesPage })),
);
const InventoryPage = lazy(() =>
  import('@/features/inventory').then((m) => ({ default: m.InventoryPage })),
);
const VouchersPage = lazy(() =>
  import('@/features/vouchers').then((m) => ({ default: m.VouchersPage })),
);
const VoucherCreatePage = lazy(() =>
  import('@/features/vouchers').then((m) => ({ default: m.VoucherCreatePage })),
);
const VoucherEditPage = lazy(() =>
  import('@/features/vouchers').then((m) => ({ default: m.VoucherEditPage })),
);
const CustomersPage = lazy(() =>
  import('@/features/customers').then((m) => ({ default: m.CustomersPage })),
);
const CustomerDetailPage = lazy(() =>
  import('@/features/customers').then((m) => ({ default: m.CustomerDetailPage })),
);
const ReviewsPage = lazy(() =>
  import('@/features/reviews').then((m) => ({ default: m.ReviewsPage })),
);
const LocationsPage = lazy(() =>
  import('@/features/locations').then((m) => ({ default: m.LocationsPage })),
);

export const router = createBrowserRouter([
  {
    path: ROUTES.login,
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
          { path: ROUTES.dashboard, element: <DashboardPage /> },

          // Orders
          { path: ROUTES.orders, element: <OrdersPage /> },
          { path: ROUTES.orderNew, element: <OrderCreatePage /> },
          { path: ROUTES.orderDetail(), element: <OrderDetailPage /> },

          // Catalog
          { path: ROUTES.products, element: <ProductsPage /> },
          { path: ROUTES.productNew, element: <ProductCreatePage /> },
          { path: ROUTES.productEdit(), element: <ProductEditPage /> },
          { path: ROUTES.categories, element: <CategoriesPage /> },
          { path: ROUTES.brands, element: <BrandsPage /> },

          // Inventory
          { path: ROUTES.branches, element: <BranchesPage /> },
          { path: ROUTES.inventory, element: <InventoryPage /> },

          // Others
          { path: ROUTES.vouchers, element: <VouchersPage /> },
          { path: ROUTES.voucherNew, element: <VoucherCreatePage /> },
          { path: ROUTES.voucherEdit(), element: <VoucherEditPage /> },
          { path: ROUTES.customers, element: <CustomersPage /> },
          { path: ROUTES.customerDetail(), element: <CustomerDetailPage /> },
          { path: ROUTES.reviews, element: <ReviewsPage /> },
          { path: ROUTES.locations, element: <LocationsPage /> },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
