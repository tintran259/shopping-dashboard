import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { ROUTES } from '@/app/routes';
import { ProductForm } from '../components/product-form';
import { useCreateProduct } from '../hooks/use-product-mutations';
import { emptyProductForm, formToPayload } from '../lib/product-schema';

export function ProductCreatePage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.products)}>
          <ArrowLeft className="size-4" />
        </Button>
        <PageHeader title="Thêm sản phẩm" />
      </div>

      <ProductForm
        defaultValues={emptyProductForm()}
        submitLabel="Tạo sản phẩm"
        isSubmitting={createProduct.isPending}
        onSubmit={(values) =>
          createProduct.mutate(formToPayload(values), {
            onSuccess: (created) => navigate(ROUTES.productEdit(created.id)),
          })
        }
      />
    </div>
  );
}
