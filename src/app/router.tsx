import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth';
import { DashboardPage } from '@/features/dashboard';
import { OrdersPage, OrderDetailPage } from '@/features/orders';
import {
  BrandsPage,
  CategoriesPage,
  ProductCreatePage,
  ProductEditPage,
  ProductsPage,
} from '@/features/catalog';
import { BranchesPage, InventoryPage } from '@/features/inventory';
import { VouchersPage } from '@/features/vouchers';
import { CustomersPage } from '@/features/customers';
import { ReviewsPage } from '@/features/reviews';
import { LocationsPage } from '@/features/locations';
import { DashboardLayout } from '@/app/layouts/dashboard-layout';
import { ProtectedRoute } from '@/app/components/protected-route';
import { NotFoundPage } from '@/app/components/not-found-page';
import { ROUTES } from './routes';

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
          { path: ROUTES.customers, element: <CustomersPage /> },
          { path: ROUTES.reviews, element: <ReviewsPage /> },
          { path: ROUTES.locations, element: <LocationsPage /> },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
