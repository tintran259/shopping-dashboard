import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { QueryBoundary } from '@/components/shared/query-boundary';
import { ROUTES } from '@/app/routes';
import { PRODUCT_FORM_ID, ProductForm } from '../components/product-form';
import {
  useDeleteProduct,
  useUpdateProduct,
} from '../hooks/use-product-mutations';
import { useProduct } from '../hooks/use-products';
import { formToPayload, productToForm } from '../lib/product-schema';

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const query = useProduct(id);
  const updateProduct = useUpdateProduct(id ?? '');
  const deleteProduct = useDeleteProduct();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(ROUTES.products)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <PageHeader title={query.data ? query.data.name : 'Sửa sản phẩm'} />
        </div>
        {query.data && (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Xóa
            </Button>
            <Button
              type="submit"
              form={PRODUCT_FORM_ID}
              loading={updateProduct.isPending}
            >
              Lưu thay đổi
            </Button>
          </div>
        )}
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}
      >
        {query.data && (
          <ProductForm
            defaultValues={productToForm(query.data)}
            onSubmit={(values) => updateProduct.mutate(formToPayload(values))}
          />
        )}
      </QueryBoundary>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        title="Xóa sản phẩm này?"
        description="Hành động không thể hoàn tác. Sản phẩm và các biến thể liên quan sẽ bị xóa."
        confirmLabel="Xóa"
        loading={deleteProduct.isPending}
        onConfirm={() =>
          id &&
          deleteProduct.mutate(id, {
            onSuccess: () => navigate(ROUTES.products),
          })
        }
      />
    </div>
  );
}
