import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form } from '@/components/ui/form';
import { FormField } from '@/components/shared/form-field';
import { MoneyInput } from '@/components/shared/money-input';
import { ProductStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useBrands, useCategories } from '../hooks/use-catalog-refs';
import {
  NO_BRAND,
  productFormSchema,
  slugify,
  type ProductFormValues,
} from '../lib/product-schema';
import { PRODUCT_STATUS_LABEL } from '../lib/labels';
import { MultiImageUpload, SingleImageUpload } from './image-upload';
import { ProductOptionsAndVariants } from './product-options-variants';

/** Form element id — pages render the submit button in the top-right header
 *  via `<Button form={PRODUCT_FORM_ID} type="submit">`. */
export const PRODUCT_FORM_ID = 'product-form';

interface ProductFormProps {
  defaultValues: ProductFormValues;
  onSubmit: (values: ProductFormValues) => void;
}

export function ProductForm({ defaultValues, onSubmit }: ProductFormProps) {
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  // Slug tự sinh từ tên. Ngừng tự sinh ngay khi người dùng gõ tay vào ô slug
  // (hoặc khi đang sửa sản phẩm đã có slug) — vẫn sửa tay được bình thường.
  const slugTouched = useRef(defaultValues.slug !== '');
  const name = form.watch('name');
  useEffect(() => {
    if (slugTouched.current) return;
    form.setValue('slug', slugify(name), { shouldValidate: false });
  }, [name, form]);

  const hasVariants = form.watch('hasVariants');
  const options = form.watch('options');
  const basePrice = form.watch('basePrice');
  const selectedCategories = form.watch('categoryIds');
  const toggleCategory = (id: string) => {
    const set = new Set(selectedCategories);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    form.setValue('categoryIds', [...set], { shouldDirty: true });
  };

  return (
    <Form {...form}>
      <form
        id={PRODUCT_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  label="Tên sản phẩm"
                  render={(f) => (
                    <Input {...f} placeholder="Nhập tên sản phẩm…" />
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  label="Slug"
                  description="Tự sinh từ tên sản phẩm — có thể sửa lại."
                  render={(f) => (
                    <Input
                      {...f}
                      placeholder="tu-sinh-tu-ten-san-pham"
                      onChange={(e) => {
                        slugTouched.current = true;
                        f.onChange(e);
                      }}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="shortDescription"
                  label="Mô tả ngắn"
                  render={(f) => (
                    <Textarea {...f} rows={2} placeholder="Nhập mô tả ngắn…" />
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  label="Mô tả chi tiết"
                  render={(f) => (
                    <Textarea
                      {...f}
                      rows={5}
                      placeholder="Nhập mô tả chi tiết…"
                    />
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hình ảnh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="thumbnail"
                  label="Ảnh đại diện (thumbnail)"
                  description="Ảnh chính hiển thị ở danh sách và trang sản phẩm."
                  render={(f) => (
                    <SingleImageUpload value={f.value} onChange={f.onChange} />
                  )}
                />
                <FormField
                  control={form.control}
                  name="gallery"
                  label="Thư viện ảnh"
                  description="Các ảnh chi tiết khác của sản phẩm — chọn được nhiều ảnh."
                  render={(f) => (
                    <MultiImageUpload value={f.value} onChange={f.onChange} />
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tùy chọn & Biến thể</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProductOptionsAndVariants
                  control={form.control}
                  setValue={form.setValue}
                  getValues={form.getValues}
                  hasVariants={hasVariants}
                  options={options}
                  productName={name}
                  basePrice={basePrice}
                />
                {form.formState.errors.options?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.options.message}
                  </p>
                )}
                {form.formState.errors.variants?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.variants.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Xuất bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  label="Trạng thái"
                  render={(f) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ProductStatus).map((s) => (
                          <SelectItem key={s} value={s}>
                            {PRODUCT_STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brandId"
                  label="Thương hiệu"
                  render={(f) => (
                    <Select value={f.value ?? NO_BRAND} onValueChange={f.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thương hiệu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_BRAND}>— Không —</SelectItem>
                        {brands?.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Giá hiển thị</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  label="Giá cơ bản (VND)"
                  render={(f) => (
                    <MoneyInput
                      {...f}
                      value={f.value ?? ''}
                      placeholder="Nhập giá cơ bản…"
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="compareAtPrice"
                  label="Giá gạch (tùy chọn)"
                  render={(f) => (
                    <MoneyInput
                      {...f}
                      value={f.value ?? ''}
                      placeholder="Nhập giá gạch nếu có…"
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Giá bán thực tế lấy theo từng biến thể; giá cơ bản chỉ để hiển
                  thị.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nhóm sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {categories?.length ? (
                  categories.map((c) => {
                    const active = selectedCategories.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleCategory(c.id)}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-sm transition-colors',
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent',
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa có nhóm sản phẩm.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
