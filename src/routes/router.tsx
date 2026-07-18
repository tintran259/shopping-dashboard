import { lazy, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/features/auth';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import { ProtectedRoute } from '@/routes/protected-route';
import {
  LandingRedirect,
  PermissionRoute,
} from '@/routes/permission-route';
import { NotFoundPage } from '@/routes/not-found-page';
import { ROUTES } from './paths';

/** Bọc phần tử route bằng gate quyền (view = mở trang, manage = trang tạo/sửa). */
const guard = (permission: string, element: ReactNode) => (
  <PermissionRoute permission={permission}>{element}</PermissionRoute>
);

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
const RolesPage = lazy(() =>
  import('@/features/access').then((m) => ({ default: m.RolesPage })),
);
const RoleCreatePage = lazy(() =>
  import('@/features/access').then((m) => ({ default: m.RoleCreatePage })),
);
const RoleDetailPage = lazy(() =>
  import('@/features/access').then((m) => ({ default: m.RoleDetailPage })),
);
const AdminsPage = lazy(() =>
  import('@/features/access').then((m) => ({ default: m.AdminsPage })),
);
const NotificationsPage = lazy(() =>
  import('@/features/notifications').then((m) => ({
    default: m.NotificationsPage,
  })),
);
const NotificationSettingsPage = lazy(() =>
  import('@/features/notifications').then((m) => ({
    default: m.NotificationSettingsPage,
  })),
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
          { index: true, element: <LandingRedirect /> },
          {
            path: ROUTES.dashboard,
            element: guard('dashboard.view', <DashboardPage />),
          },

          // Orders
          { path: ROUTES.orders, element: guard('orders.view', <OrdersPage />) },
          {
            path: ROUTES.orderNew,
            element: guard('orders.create', <OrderCreatePage />),
          },
          {
            path: ROUTES.orderDetail(),
            element: guard('orders.view', <OrderDetailPage />),
          },

          // Catalog
          {
            path: ROUTES.products,
            element: guard('catalog.view', <ProductsPage />),
          },
          {
            path: ROUTES.productNew,
            element: guard('catalog.create', <ProductCreatePage />),
          },
          {
            path: ROUTES.productEdit(),
            element: guard('catalog.update', <ProductEditPage />),
          },
          {
            path: ROUTES.categories,
            element: guard('catalog.view', <CategoriesPage />),
          },
          { path: ROUTES.brands, element: guard('catalog.view', <BrandsPage />) },

          // Inventory
          {
            path: ROUTES.branches,
            element: guard('inventory.view', <BranchesPage />),
          },
          {
            path: ROUTES.inventory,
            element: guard('inventory.view', <InventoryPage />),
          },

          // Others
          {
            path: ROUTES.vouchers,
            element: guard('vouchers.view', <VouchersPage />),
          },
          {
            path: ROUTES.voucherNew,
            element: guard('vouchers.create', <VoucherCreatePage />),
          },
          {
            path: ROUTES.voucherEdit(),
            element: guard('vouchers.update', <VoucherEditPage />),
          },
          {
            path: ROUTES.customers,
            element: guard('customers.view', <CustomersPage />),
          },
          {
            path: ROUTES.customerDetail(),
            element: guard('customers.view', <CustomerDetailPage />),
          },
          {
            path: ROUTES.reviews,
            element: guard('reviews.view', <ReviewsPage />),
          },
          {
            path: ROUTES.locations,
            element: guard('inventory.view', <LocationsPage />),
          },

          // Notification Center — cá nhân, mọi user BO đều truy cập được.
          { path: ROUTES.notifications, element: <NotificationsPage /> },
          {
            path: ROUTES.notificationSettings,
            element: <NotificationSettingsPage />,
          },

          // Phân quyền (super admin)
          {
            path: ROUTES.roles,
            element: (
              <PermissionRoute superAdminOnly>
                <RolesPage />
              </PermissionRoute>
            ),
          },
          {
            path: ROUTES.roleNew,
            element: (
              <PermissionRoute superAdminOnly>
                <RoleCreatePage />
              </PermissionRoute>
            ),
          },
          {
            path: ROUTES.roleDetail(),
            element: (
              <PermissionRoute superAdminOnly>
                <RoleDetailPage />
              </PermissionRoute>
            ),
          },
          {
            path: ROUTES.admins,
            element: (
              <PermissionRoute superAdminOnly>
                <AdminsPage />
              </PermissionRoute>
            ),
          },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
