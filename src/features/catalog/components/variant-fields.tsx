import { useFieldArray, type Control } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FormField } from '@/components/shared/form-field';
import type { ProductFormValues } from '../lib/product-schema';

interface VariantFieldsProps {
  control: Control<ProductFormValues>;
}

/** Dynamic list of product variants (each with its own option-value pairs). */
export function VariantFields({ control }: VariantFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Biến thể #{index + 1}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              disabled={fields.length <= 1}
              onClick={() => remove(index)}
              aria-label="Xóa biến thể"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name={`variants.${index}.sku`}
              label="SKU"
              render={(f) => <Input {...f} placeholder="LATA-COFFEE-250" />}
            />
            <FormField
              control={control}
              name={`variants.${index}.price`}
              label="Giá (VND)"
              render={(f) => <Input {...f} inputMode="decimal" placeholder="199000" />}
            />
            <FormField
              control={control}
              name={`variants.${index}.compareAtPrice`}
              label="Giá gạch (tùy chọn)"
              render={(f) => <Input {...f} inputMode="decimal" placeholder="249000" />}
            />
            <FormField
              control={control}
              name={`variants.${index}.imageUrl`}
              label="Ảnh biến thể (URL)"
              render={(f) => <Input {...f} placeholder="https://…" />}
            />
          </div>

          <Separator />
          <VariantOptionValues control={control} variantIndex={index} />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            sku: '',
            price: '',
            compareAtPrice: '',
            imageUrl: '',
            optionValues: [],
          })
        }
      >
        <Plus className="size-4" />
        Thêm biến thể
      </Button>
    </div>
  );
}

function VariantOptionValues({
  control,
  variantIndex,
}: {
  control: Control<ProductFormValues>;
  variantIndex: number;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variants.${variantIndex}.optionValues`,
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Giá trị tùy chọn (vd: Màu → Đen, Size → M)
      </p>
      {fields.map((field, i) => (
        <div key={field.id} className="flex items-start gap-2">
          <FormField
            control={control}
            name={`variants.${variantIndex}.optionValues.${i}.name`}
            className="flex-1"
            render={(f) => <Input {...f} placeholder="Tên tùy chọn (Màu)" />}
          />
          <FormField
            control={control}
            name={`variants.${variantIndex}.optionValues.${i}.value`}
            className="flex-1"
            render={(f) => <Input {...f} placeholder="Giá trị (Đen)" />}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 text-destructive"
            onClick={() => remove(i)}
            aria-label="Xóa giá trị"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => append({ name: '', value: '' })}
      >
        <Plus className="size-3.5" />
        Thêm giá trị tùy chọn
      </Button>
    </div>
  );
}
