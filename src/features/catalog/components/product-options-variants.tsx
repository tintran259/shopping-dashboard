import { useState } from 'react';
import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
} from 'react-hook-form';
import { Info, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormField } from '@/components/shared/form-field';
import { MoneyInput } from '@/components/shared/money-input';
import { cn } from '@/lib/utils';
import {
  emptyOption,
  generateVariants,
  variantComboLabel,
  type ProductFormValues,
  type ProductOptionFormValue,
} from '../lib/product-schema';
import { SingleImageUpload } from './image-upload';

interface ProductOptionsAndVariantsProps {
  control: Control<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  getValues: UseFormGetValues<ProductFormValues>;
  hasVariants: boolean;
  options: ProductOptionFormValue[];
  productName: string;
  basePrice: string;
}

/** Minimal on/off switch — the only place this app needs one, so kept local
 *  rather than a new shared ui primitive. */
function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span
        className={cn(
          'inline-block size-4 translate-x-0.5 transform rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-4',
        )}
      />
    </button>
  );
}

/** Tag editor for one option's declared values (vd Trắng/Đen/Đỏ) — Enter or
 *  comma commits the current draft as a new tag. */
function TagValuesInput({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border p-1.5">
      {values.map((v) => (
        <span
          key={v}
          className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
        >
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            aria-label={`Xóa ${v}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        placeholder="Nhập giá trị rồi Enter…"
        className="min-w-28 flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

/**
 * Product options + auto-generated variant grid. Each option only declares a
 * name + tag values (vd "Màu sắc": Trắng/Đen/Đỏ) — variants are generated as
 * the Cartesian product of every option's values via "Tạo biến thể", then
 * SKU/giá/ảnh are edited per row. Re-generating (options changed → "Tạo lại")
 * preserves already-edited rows whose combination still exists.
 */
export function ProductOptionsAndVariants({
  control,
  setValue,
  getValues,
  hasVariants,
  options,
  productName,
  basePrice,
}: ProductOptionsAndVariantsProps) {
  const optionFields = useFieldArray<ProductFormValues, 'options'>({
    control,
    name: 'options',
  });
  // `.fields` below is only ever used for its stable `.id` (React keys) and
  // length — NOT for reading current values. useFieldArray's `fields` is a
  // snapshot that goes stale the moment a nested input is edited through its
  // own registered Controller (every SKU/price cell here), so any code that
  // needs live values (regenerate, bulk edit) must read via `getValues`
  // instead — otherwise it silently reverts recent edits and can resend a
  // variant's OLD id for a row whose id has since changed, corrupting the
  // update payload.
  const variantFields = useFieldArray<ProductFormValues, 'variants'>({
    control,
    name: 'variants',
  });
  // Live per-row values for the two cells NOT already routed through their own
  // Controller (imageUrl, optionValues) — `variantFields.fields` alone won't
  // reflect a plain `setValue` call (see note above), so this is what the
  // image cell and combo-label cell actually render from.
  const watchedVariants = useWatch({ control, name: 'variants' });

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkPrice, setBulkPrice] = useState('');

  const expectedCombos = options.reduce((n, o) => n * (o.values.length || 0), 1);
  const canGenerate = options.length > 0 && options.every((o) => o.values.length > 0);

  const handleGenerate = () => {
    const next = generateVariants(options, getValues('variants'), productName, basePrice);
    setValue('variants', next, { shouldValidate: true, shouldDirty: true });
    setSelected(new Set());
  };

  const toggleSelected = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const applyBulkPrice = () => {
    if (!bulkPrice) return;
    getValues('variants').forEach((_, index) => {
      if (selected.has(index)) {
        setValue(`variants.${index}.price`, bulkPrice, { shouldDirty: true });
      }
    });
    setBulkPrice('');
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Sản phẩm có nhiều tùy chọn</p>
          <p className="text-xs text-muted-foreground">
            Bật nếu sản phẩm có nhiều loại (màu sắc, kích cỡ,…) — mỗi tổ hợp là
            1 biến thể riêng.
          </p>
        </div>
        <Switch
          checked={hasVariants}
          onCheckedChange={(v) => {
            setValue('hasVariants', v, { shouldDirty: true });
            // Bật lần đầu (chưa có nhóm tùy chọn nào) → tạo sẵn 1 nhóm trống
            // để admin điền, thay vì hiện lưới rỗng không có gì để bấm.
            if (v && optionFields.fields.length === 0) {
              optionFields.append(emptyOption());
            }
          }}
        />
      </div>

      {!hasVariants ? (
        <FormField
          control={control}
          name="singleSku"
          label="Mã SKU"
          render={(f) => (
            <Input {...f} value={f.value ?? ''} placeholder="Nhập mã SKU…" />
          )}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {optionFields.fields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Tùy chọn {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    disabled={optionFields.fields.length <= 1}
                    onClick={() => optionFields.remove(index)}
                    aria-label="Xóa tùy chọn"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <FormField
                  control={control}
                  name={`options.${index}.name`}
                  label="Tên tùy chọn"
                  render={(f) => (
                    <Input {...f} placeholder="Nhập tên tùy chọn (vd: Màu sắc)…" />
                  )}
                />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Giá trị</p>
                  <TagValuesInput
                    values={options[index]?.values ?? []}
                    onChange={(values) =>
                      setValue(`options.${index}.values`, values, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => optionFields.append(emptyOption())}
          >
            <Plus className="size-3.5" />
            Thêm tùy chọn
          </Button>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-3">
            <Button type="button" disabled={!canGenerate} onClick={handleGenerate}>
              {variantFields.fields.length > 0 ? 'Tạo lại' : 'Tạo biến thể'}
            </Button>
            {canGenerate && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3.5" />
                Hệ thống sẽ tạo {expectedCombos} biến thể (
                {options.map((o) => `${o.values.length} ${o.name || 'giá trị'}`).join(' x ')}
                )
              </p>
            )}
          </div>

          {variantFields.fields.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              Chưa có biến thể — khai báo đủ giá trị cho các tùy chọn rồi bấm
              &quot;Tạo biến thể&quot;.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Biến thể được tạo ({variantFields.fields.length})
                </p>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={selected.size === 0}
                      >
                        Bulk edit
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 space-y-3 p-3" align="end">
                      <p className="text-xs text-muted-foreground">
                        Áp dụng giá cho {selected.size} biến thể đã chọn
                      </p>
                      <MoneyInput
                        value={bulkPrice}
                        onChange={setBulkPrice}
                        placeholder="Nhập giá mới…"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        disabled={!bulkPrice}
                        onClick={applyBulkPrice}
                      >
                        Áp dụng
                      </Button>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canGenerate}
                    onClick={handleGenerate}
                  >
                    <RefreshCw className="size-3.5" />
                    Tạo lại
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Bạn có thể chỉnh sửa ảnh, SKU, giá cho từng biến thể — tồn kho
                nhập ở trang Tồn kho sau khi tạo xong sản phẩm.
              </p>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10" />
                      <TableHead className="w-16">Ảnh</TableHead>
                      <TableHead>Tên biến thể</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Giá (đ)</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variantFields.fields.map((field, index) => {
                      const live = watchedVariants[index];
                      return (
                      <TableRow key={field.id} className="hover:bg-transparent">
                        <TableCell>
                          <input
                            type="checkbox"
                            className="size-4 rounded border-input"
                            checked={selected.has(index)}
                            onChange={() => toggleSelected(index)}
                            aria-label="Chọn biến thể"
                          />
                        </TableCell>
                        <TableCell>
                          <SingleImageUpload
                            size="sm"
                            value={live?.imageUrl ?? ''}
                            onChange={(url) =>
                              setValue(`variants.${index}.imageUrl`, url, {
                                shouldDirty: true,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {variantComboLabel(options, live?.optionValues ?? {})}
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={control}
                            name={`variants.${index}.sku`}
                            render={(f) => <Input {...f} className="h-8" />}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={control}
                            name={`variants.${index}.price`}
                            render={(f) => (
                              <MoneyInput {...f} value={f.value ?? ''} className="h-8" />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => variantFields.remove(index)}
                            aria-label="Xóa biến thể"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
