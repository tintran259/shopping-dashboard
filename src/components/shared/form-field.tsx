import { type ReactNode } from 'react';
import type {
  Control,
  FieldPath,
  FieldValues,
  ControllerRenderProps,
} from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField as RhfFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface FormFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> {
  control: Control<TValues>;
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  /** Render the actual input, wired to RHF via `field`. */
  render: (field: ControllerRenderProps<TValues, TName>) => ReactNode;
  className?: string;
}

/**
 * Reusable field wrapper: label + control + validation message in one place,
 * so feature forms only supply the input element.
 */
export function FormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  control,
  name,
  label,
  description,
  render,
  className,
}: FormFieldProps<TValues, TName>) {
  return (
    <RhfFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>{render(field)}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
