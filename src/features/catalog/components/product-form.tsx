import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { OptionDisplayType, ProductStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useBrands, useCategories } from '../hooks/use-catalog-refs';
import {
  NO_BRAND,
  productFormSchema,
  type ProductFormValues,
} from '../lib/product-schema';
import { PRODUCT_STATUS_LABEL } from '../lib/labels';
import { VariantFields } from './variant-fields';

interface ProductFormProps {
  defaultValues: ProductFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: ProductFormValues) => void;
}

export function ProductForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
}: ProductFormProps) {
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const images = useFieldArray({ control: form.control, name: 'images' });
  const options = useFieldArray({ control: form.control, name: 'options' });

  const selectedCategories = form.watch('categoryIds');
  const toggleCategory = (id: string) => {
    const set = new Set(selectedCategories);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    form.setValue('categoryIds', [...set], { shouldDirty: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  render={(f) => <Input {...f} placeholder="Cà phê Cầu Đất" />}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  label="Slug"
                  description="Chỉ chữ thường, số và dấu gạch ngang."
                  render={(f) => <Input {...f} placeholder="ca-phe-cau-dat" />}
                />
                <FormField
                  control={form.control}
                  name="shortDescription"
                  label="Mô tả ngắn"
                  render={(f) => (
                    <Textarea {...f} rows={2} placeholder="Mô tả ngắn gọn…" />
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  label="Mô tả chi tiết"
                  render={(f) => <Textarea {...f} rows={5} />}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tùy chọn (options)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {options.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <FormField
                      control={form.control}
                      name={`options.${index}.name`}
                      label="Tên"
                      render={(f) => <Input {...f} placeholder="Màu" />}
                    />
                    <FormField
                      control={form.control}
                      name={`options.${index}.values`}
                      label="Giá trị (phân tách bằng dấu phẩy)"
                      render={(f) => <Input {...f} placeholder="Đen, Trắng" />}
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => options.remove(index)}
                        aria-label="Xóa tùy chọn"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <input
                      type="hidden"
                      {...form.register(`options.${index}.displayType`)}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    options.append({
                      name: '',
                      displayType: OptionDisplayType.PILL,
                      values: '',
                    })
                  }
                >
                  <Plus className="size-4" />
                  Thêm tùy chọn
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Biến thể (variants)</CardTitle>
              </CardHeader>
              <CardContent>
                <VariantFields control={form.control} />
                {form.formState.errors.variants?.root && (
                  <p className="mt-2 text-xs font-medium text-destructive">
                    {form.formState.errors.variants.root.message}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hình ảnh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {images.fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`images.${index}.url`}
                      className="flex-1"
                      render={(f) => <Input {...f} placeholder="https://…" />}
                    />
                    <FormField
                      control={form.control}
                      name={`images.${index}.alt`}
                      className="flex-1"
                      render={(f) => <Input {...f} placeholder="Mô tả ảnh" />}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-0.5 text-destructive"
                      onClick={() => images.remove(index)}
                      aria-label="Xóa ảnh"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    images.append({
                      url: '',
                      alt: '',
                      isPrimary: images.fields.length === 0,
                    })
                  }
                >
                  <Plus className="size-4" />
                  Thêm ảnh
                </Button>
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
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  {submitLabel}
                </Button>
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
                  render={(f) => <Input {...f} inputMode="decimal" placeholder="199000" />}
                />
                <FormField
                  control={form.control}
                  name="compareAtPrice"
                  label="Giá gạch (tùy chọn)"
                  render={(f) => <Input {...f} inputMode="decimal" placeholder="249000" />}
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
