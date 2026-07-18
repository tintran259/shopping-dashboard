import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/shared/form-field';
import { cn } from '@/lib/utils';
import { SingleImageUpload } from '../ImageUpload';
import {
  categorySchema,
  NO_PARENT,
  type CategoryDialogTarget,
  type CategoryFormValues,
} from '../../lib/category-schema';
import { slugify } from '../../lib/product-schema';
import type { Category } from '../../types';

const EMPTY: CategoryFormValues = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  parentId: NO_PARENT,
  isActive: true,
  metaTitle: '',
  metaDescription: '',
};

export function CategoryFormDialog({
  target,
  parentOptions,
  loading,
  onOpenChange,
  onSubmit,
}: {
  target: CategoryDialogTarget | null;
  parentOptions: Category[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CategoryFormValues) => void;
}) {
  const [seoOpen, setSeoOpen] = useState(false);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!target) return;
    if (target.mode === 'edit') {
      const c = target.category;
      form.reset({
        name: c.name,
        slug: c.slug,
        description: c.description ?? '',
        imageUrl: c.imageUrl ?? '',
        parentId: c.parentId ?? NO_PARENT,
        isActive: c.isActive,
        metaTitle: c.seo?.metaTitle ?? '',
        metaDescription: c.seo?.metaDescription ?? '',
      });
      setSeoOpen(!!(c.seo?.metaTitle || c.seo?.metaDescription));
    } else {
      setSeoOpen(false);
      form.reset({ ...EMPTY, parentId: target.parentId ?? NO_PARENT });
    }
  }, [target, form]);

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {target?.mode === 'edit' ? 'Sửa danh mục' : 'Thêm danh mục'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="category-form"
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {/* Ảnh đại diện cạnh tên/slug — nhóm 3 trường "định danh" của danh
                mục vào cùng một hàng, thay vì xếp dọc từng ô như trước. */}
            <div className="flex gap-3">
              <FormField
                control={form.control}
                name="imageUrl"
                className="shrink-0"
                render={(f) => (
                  <SingleImageUpload
                    value={f.value ?? ''}
                    onChange={f.onChange}
                    size="sm"
                  />
                )}
              />
              <div className="flex-1 space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  label="Tên"
                  render={(f) => (
                    <Input
                      {...f}
                      placeholder="Đặc sản Đà Lạt"
                      onChange={(e) => {
                        f.onChange(e);
                        if (target?.mode !== 'edit') {
                          form.setValue('slug', slugify(e.target.value), {
                            shouldValidate: false,
                          });
                        }
                      }}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  label="Slug"
                  render={(f) => (
                    <div className="flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring">
                      <span className="shrink-0 pl-3 text-sm text-muted-foreground">
                        /c/
                      </span>
                      <Input
                        {...f}
                        placeholder="dac-san-da-lat"
                        className="border-0 focus-visible:ring-0"
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parentId"
                label="Danh mục cha"
                render={(f) => (
                  <Select value={f.value} onValueChange={f.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT}>— Danh mục gốc —</SelectItem>
                      {parentOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                label="Trạng thái"
                render={(f) => (
                  <div className="flex gap-2">
                    {(
                      [
                        { value: true, label: 'Hiển thị' },
                        { value: false, label: 'Ẩn' },
                      ] as const
                    ).map((opt) => (
                      <label
                        key={String(opt.value)}
                        className={cn(
                          'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-sm transition-colors',
                          f.value === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-accent',
                        )}
                      >
                        <input
                          type="radio"
                          className="size-3.5"
                          checked={f.value === opt.value}
                          onChange={() => f.onChange(opt.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              label="Mô tả"
              render={(f) => (
                <Textarea {...f} rows={3} placeholder="Mô tả danh mục…" />
              )}
            />

            <div className="rounded-md border">
              <button
                type="button"
                onClick={() => setSeoOpen((o) => !o)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
              >
                Cài đặt SEO (tùy chọn)
                <ChevronRight
                  className={cn('size-4 transition-transform', seoOpen && 'rotate-90')}
                />
              </button>
              {seoOpen && (
                <div className="space-y-3 border-t p-3">
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    label="Meta title"
                    description="Tối đa 70 ký tự — hiển thị trên tab trình duyệt/kết quả tìm kiếm."
                    render={(f) => (
                      <Input {...f} placeholder="Để trống = dùng tên danh mục" />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="metaDescription"
                    label="Meta description"
                    description="Tối đa 160 ký tự — đoạn mô tả hiển thị dưới tiêu đề trên Google."
                    render={(f) => (
                      <Textarea
                        {...f}
                        rows={2}
                        placeholder="Để trống = dùng mô tả danh mục"
                      />
                    )}
                  />
                </div>
              )}
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="submit" form="category-form" loading={loading}>
            {target?.mode === 'edit' ? 'Lưu' : 'Tạo danh mục'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
