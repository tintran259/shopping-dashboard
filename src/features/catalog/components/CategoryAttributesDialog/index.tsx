import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FormField } from '@/components/shared/form-field';
import { Switch } from '@/components/shared/switch';
import {
  useCategoryAttributes,
  useCreateCategoryAttribute,
  useDeleteCategoryAttribute,
  useUpdateCategoryAttribute,
} from '../../hooks/use-category-attributes';
import type { Category, CategoryAttribute, CategoryAttributeType } from '../../types';

const TYPE_LABEL: Record<CategoryAttributeType, string> = {
  text: 'Văn bản',
  number: 'Số',
  select: 'Chọn 1',
  multiselect: 'Chọn nhiều',
  boolean: 'Có/Không',
};

const OPTIONS_TYPES = new Set<CategoryAttributeType>(['select', 'multiselect']);

const schema = z
  .object({
    name: z.string().trim().min(1, 'Nhập tên thuộc tính'),
    type: z.enum(['text', 'number', 'select', 'multiselect', 'boolean']),
    optionsText: z.string().trim().optional(),
    isRequired: z.boolean(),
  })
  .refine((v) => !OPTIONS_TYPES.has(v.type) || (v.optionsText ?? '').trim().length > 0, {
    message: 'Nhập ít nhất 1 tùy chọn, cách nhau bằng dấu phẩy',
    path: ['optionsText'],
  });
type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { name: '', type: 'text', optionsText: '', isRequired: false };

function parseOptions(text: string | undefined): string[] {
  return (text ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

interface CategoryAttributesDialogProps {
  category: Category | null;
  onOpenChange: (open: boolean) => void;
}

/** Manage a (leaf) category's filter-attribute *templates* — e.g. "Size" as
 *  a SELECT with options S/M/L. Definitions only: this does not touch any
 *  product's actual values (`ProductAttribute`, unrelated/unchanged). */
export function CategoryAttributesDialog({ category, onOpenChange }: CategoryAttributesDialogProps) {
  const categoryId = category?.id ?? '';
  const query = useCategoryAttributes(category?.id);
  const createAttribute = useCreateCategoryAttribute(categoryId);
  const updateAttribute = useUpdateCategoryAttribute(categoryId);
  const deleteAttribute = useDeleteCategoryAttribute(categoryId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<CategoryAttribute | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues });
  const type = form.watch('type');

  useEffect(() => {
    if (!category) {
      setEditingId(null);
      setShowForm(false);
    }
  }, [category]);

  const startCreate = () => {
    setEditingId(null);
    form.reset(emptyValues);
    setShowForm(true);
  };

  const startEdit = (attr: CategoryAttribute) => {
    setEditingId(attr.id);
    form.reset({
      name: attr.name,
      type: attr.type,
      optionsText: attr.options?.join(', ') ?? '',
      isRequired: attr.isRequired,
    });
    setShowForm(true);
  };

  const isPending = createAttribute.isPending || updateAttribute.isPending;

  const onSubmit = (values: FormValues) => {
    const body = {
      name: values.name,
      type: values.type,
      options: OPTIONS_TYPES.has(values.type) ? parseOptions(values.optionsText) : undefined,
      isRequired: values.isRequired,
    };
    const onSuccess = () => setShowForm(false);
    if (editingId) {
      updateAttribute.mutate({ id: editingId, body }, { onSuccess });
    } else {
      createAttribute.mutate(body, { onSuccess });
    }
  };

  return (
    <>
      <Dialog open={!!category} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Thuộc tính lọc — {category?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {query.isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải…</p>
            ) : query.data?.length ? (
              query.data.map((attr) => (
                <div key={attr.id} className="flex items-center gap-2 rounded-md border p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{attr.name}</span>
                      <Badge variant="info">{TYPE_LABEL[attr.type]}</Badge>
                      {attr.isRequired && <Badge variant="muted">Bắt buộc</Badge>}
                    </div>
                    {!!attr.options?.length && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {attr.options.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Sửa" onClick={() => startEdit(attr)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label="Xóa"
                    onClick={() => setToDelete(attr)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có thuộc tính lọc nào.</p>
            )}
          </div>

          {showForm ? (
            <Form {...form}>
              <form
                className="space-y-3 rounded-md border p-3"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="name"
                    label="Tên thuộc tính"
                    render={(f) => <Input {...f} placeholder="Size" />}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    label="Kiểu dữ liệu"
                    render={(f) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(TYPE_LABEL) as CategoryAttributeType[]).map((t) => (
                            <SelectItem key={t} value={t}>
                              {TYPE_LABEL[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                {OPTIONS_TYPES.has(type) && (
                  <FormField
                    control={form.control}
                    name="optionsText"
                    label="Tùy chọn"
                    description="Cách nhau bằng dấu phẩy."
                    render={(f) => <Input {...f} placeholder="S, M, L" />}
                  />
                )}
                <FormField
                  control={form.control}
                  name="isRequired"
                  render={(f) => (
                    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <p className="text-sm font-medium">Bắt buộc nhập</p>
                      <Switch checked={f.value} onCheckedChange={f.onChange} />
                    </div>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" loading={isPending}>
                    {editingId ? 'Lưu' : 'Thêm'}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Button variant="outline" onClick={startCreate}>
              <Plus className="size-4" />
              Thêm thuộc tính
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        destructive
        title={`Xóa thuộc tính "${toDelete?.name}"?`}
        confirmLabel="Xóa"
        loading={deleteAttribute.isPending}
        onConfirm={() =>
          toDelete &&
          deleteAttribute.mutate(toDelete.id, {
            onSuccess: () => setToDelete(null),
          })
        }
      />
    </>
  );
}
