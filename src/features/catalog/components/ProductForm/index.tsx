import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
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
import { DatePickerField } from '@/components/shared/date-picker-field';
import { FormField } from '@/components/shared/form-field';
import { MoneyInput } from '@/components/shared/money-input';
import { ProductStatus } from '@/types';
import { cn } from '@/lib/utils';
import { categoryPath, leafCategories } from '../../lib/category-tree';
import { useBrands, useCategories } from '../../hooks/use-catalog-refs';
import {
  LOCKED_INVENTORY_STATUSES,
  NO_BRAND,
  productFormSchema,
  roundToVnd,
  skuPrefixFromSlug,
  slugify,
  type ProductFormValues,
} from '../../lib/product-schema';
import { PRODUCT_STATUS_LABEL } from '../../lib/labels';
import { MultiImageUpload, SingleImageUpload } from '../ImageUpload';
import { ProductOptionsAndVariants } from '../ProductOptionsVariants';
import { StatusChangeConfirmDialog } from '../StatusChangeConfirmDialog';

/** Form element id — pages render the submit button in the top-right header
 *  via `<Button form={PRODUCT_FORM_ID} type="submit">`. */
export const PRODUCT_FORM_ID = 'product-form';

interface ProductFormProps {
  /** Undefined for the create flow — there's no inventory to reset/preview
   *  yet, so the status-change confirm dialog never applies there. */
  productId?: string;
  defaultValues: ProductFormValues;
  onSubmit: (values: ProductFormValues) => void;
}

export function ProductForm({ productId, defaultValues, onSubmit }: ProductFormProps) {
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
  const slug = form.watch('slug');
  const selectedCategories = form.watch('categoryIds');

  // Mã SKU (sản phẩm 1 loại) tự sinh từ slug. Sản phẩm MỚI (chưa có gì để
  // giữ) → theo dõi slug sống suốt phiên tạo, cập nhật theo từng nhịp gõ tên;
  // sản phẩm ĐANG SỬA (đã có slug ngay khi mở form) → không đụng vào SKU thật
  // đã lưu dù slug có sửa lại, cùng nguyên tắc "SKU ổn định" như với biến thể.
  const isExistingProduct = useRef(defaultValues.slug !== '');
  useEffect(() => {
    if (hasVariants || !slug || isExistingProduct.current) return;
    form.setValue('singleSku', skuPrefixFromSlug(slug), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [hasVariants, slug, form]);
  // Chọn "Hết hàng"/"Ngừng bán" không commit ngay — mở popup xác nhận kèm tồn
  // kho hiện tại từng chi nhánh trước, vì BE sẽ đưa tất cả về 0 khi lưu.
  const [pendingStatus, setPendingStatus] = useState<ProductStatus | null>(null);

  // Giá gạch: nhập % giảm giá (tự tính ngược ra compareAtPrice) HOẶC nhập
  // thẳng giá cụ thể — chỉ FE tính toán, BE vẫn chỉ nhận đúng 1 giá trị
  // compareAtPrice như trước. `comparePercent` không thuộc schema/không gửi
  // lên BE. Công thức: giá cơ bản = giá gạch − (giá gạch × %), nên
  // giá gạch = giá cơ bản ÷ (1 − %/100) — vd giá cơ bản 150k, giảm 25% →
  // giá gạch 200k (200 − 200×25% = 150).
  const [comparePercent, setComparePercent] = useState('');
  const compareAtPrice = form.watch('compareAtPrice');
  const percentActive = comparePercent.trim() !== '';
  const amountActive = !percentActive && !!compareAtPrice?.trim();

  // Cảnh báo MỀM (chỉ nhắc, không chặn lưu): giá gạch lẽ ra phải cao hơn giá cơ
  // bản mới hiển thị được mức giảm — nếu ≤ giá cơ bản thì gạch giá vô nghĩa.
  const baseNum = Number(basePrice) || 0;
  const compareNum = Number(compareAtPrice) || 0;
  const compareBelowBase = compareNum > 0 && baseNum > 0 && compareNum <= baseNum;

  useEffect(() => {
    if (!percentActive) return;
    const base = Number(basePrice) || 0;
    const pct = Number(comparePercent);
    const valid = Number.isFinite(pct) && pct < 100;
    const computed =
      base > 0 && valid ? Math.max(0, roundToVnd(base / (1 - pct / 100))) : 0;
    form.setValue('compareAtPrice', computed > 0 ? String(computed) : '', {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [percentActive, comparePercent, basePrice, form]);

  // Tự điền "Giá cơ bản" = giá thấp nhất trong các biến thể khi sản phẩm có
  // biến thể (giá hiển thị dạng "từ X đ") để admin đỡ phải tự nghĩ. Chỉ tự điền
  // CHO TỚI KHI admin tự sửa ô (cờ touched, giống slug) — sau đó dừng hẳn để
  // admin xoá/gõ tự do, không bị ô "nhảy" lại giá min mỗi lần xoá trống. Luồng
  // sửa: đã có giá sẵn → coi như đã touched → không tự đè giá đã lưu.
  const variants = form.watch('variants');
  const basePriceTouched = useRef(defaultValues.basePrice.trim() !== '');
  useEffect(() => {
    if (!hasVariants || basePriceTouched.current) return;
    const prices = variants
      .map((v) => Number(v.price))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (!prices.length) return;
    const min = String(Math.min(...prices));
    if (form.getValues('basePrice') !== min) {
      form.setValue('basePrice', min, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [hasVariants, variants, form]);

  const toggleCategory = (id: string) => {
    const set = new Set(selectedCategories);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    form.setValue('categoryIds', [...set], { shouldDirty: true });
  };

  // Sản phẩm chỉ gắn vào danh mục lá (không có danh mục con) — giữ cây gọn
  // cho việc lọc/thống kê. Vẫn hiển thị (không cho bỏ chọn ngoài) một danh mục
  // đã gắn từ trước nếu sau này nó không còn là lá nữa, để không âm thầm mất
  // dữ liệu đã chọn.
  const byId = new Map((categories ?? []).map((c) => [c.id, c]));
  const leafIds = new Set(leafCategories(categories ?? []).map((c) => c.id));
  const pickerCategories = (categories ?? []).filter(
    (c) => leafIds.has(c.id) || selectedCategories.includes(c.id),
  );

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
                  slug={slug}
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
                    <Select
                      value={f.value}
                      onValueChange={(next) => {
                        const target = next as ProductStatus;
                        if (
                          productId &&
                          target !== f.value &&
                          LOCKED_INVENTORY_STATUSES.includes(target)
                        ) {
                          setPendingStatus(target);
                          return;
                        }
                        f.onChange(next);
                      }}
                    >
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
                      onChange={(v) => {
                        // Admin đã tự sửa → ngừng tự điền theo giá biến thể.
                        basePriceTouched.current = true;
                        f.onChange(v);
                      }}
                      placeholder="Nhập giá cơ bản…"
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="compareAtPrice"
                  label="Giá gạch (tùy chọn)"
                  description="Nhập % giảm giá so với giá gạch để tự tính, hoặc nhập thẳng giá cụ thể — chỉ chọn 1 trong 2."
                  render={(f) => (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Input
                          inputMode="decimal"
                          value={comparePercent}
                          disabled={amountActive}
                          onChange={(e) => {
                            const next = e.target.value.replace(/[^\d.]/g, '');
                            setComparePercent(next);
                            if (!next.trim()) f.onChange('');
                          }}
                          placeholder="% giảm giá"
                          className="pr-7 text-right tabular-nums"
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          %
                        </span>
                      </div>
                      <MoneyInput
                        value={f.value ?? ''}
                        onChange={f.onChange}
                        disabled={percentActive}
                        placeholder="Giá cụ thể…"
                      />
                    </div>
                  )}
                />
                {compareBelowBase && (
                  <p className="flex items-center gap-1.5 text-xs text-warning">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    Giá gạch đang thấp hơn hoặc bằng giá cơ bản — nên đặt cao hơn
                    để hiển thị mức giảm (không bắt buộc, vẫn lưu được).
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {hasVariants
                    ? 'Giá bán thực tế lấy theo từng biến thể; giá cơ bản chỉ để hiển thị — tự điền theo giá biến thể thấp nhất, sửa được.'
                    : 'Giá bán thực tế lấy theo biến thể; giá cơ bản để hiển thị.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hạn sử dụng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <FormField
                  control={form.control}
                  name="expiryDate"
                  label="Ngày hết hạn"
                  render={(f) => (
                    <DatePickerField
                      value={f.value ?? ''}
                      onChange={f.onChange}
                      placeholder="Chọn ngày hết hạn…"
                      clearLabel="Bỏ chọn (vô thời hạn)"
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Bỏ trống nếu hàng <strong>không có hạn dùng</strong> (quần áo,
                  đồ dùng…) — sẽ hiển thị “vô thời hạn”. Với hàng có HSD (đồ ăn,
                  mỹ phẩm…), chọn ngày để hệ thống cảnh báo{' '}
                  <strong>sắp hết hạn</strong> (trong 30 ngày) và{' '}
                  <strong>đã hết hạn</strong> ở danh sách sản phẩm.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nhóm sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {pickerCategories.length ? (
                  pickerCategories.map((c) => {
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
                        {categoryPath(c.id, byId)}
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

      {productId && pendingStatus && (
        <StatusChangeConfirmDialog
          open
          onOpenChange={(o) => !o && setPendingStatus(null)}
          productId={productId}
          targetStatus={pendingStatus}
          onConfirm={() => {
            form.setValue('status', pendingStatus, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setPendingStatus(null);
          }}
        />
      )}
    </Form>
  );
}
