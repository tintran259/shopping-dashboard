import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { uploadsApi } from '../api/uploads-api';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

async function uploadFiles(files: File[]): Promise<string[]> {
  try {
    const { urls } = await uploadsApi.upload(files);
    return urls;
  } catch (error) {
    toast.error(
      error instanceof ApiError ? error.message : 'Tải ảnh lên thất bại',
    );
    return [];
  }
}

interface ImageTileProps {
  url: string;
  onRemove: () => void;
  size?: 'sm' | 'md';
}

function ImageTile({ url, onRemove, size = 'md' }: ImageTileProps) {
  return (
    <div
      className={cn(
        'group relative shrink-0 overflow-hidden rounded-lg border bg-muted',
        size === 'md' ? 'size-24' : 'size-16',
      )}
    >
      <img src={url} alt="" className="size-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Xóa ảnh"
        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

interface AddTileProps {
  uploading: boolean;
  onPick: () => void;
  size?: 'sm' | 'md';
  label?: string;
}

function AddTile({ uploading, onPick, size = 'md', label }: AddTileProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={uploading}
      className={cn(
        'flex shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-60',
        size === 'md' ? 'size-24' : 'size-16',
      )}
    >
      {uploading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ImagePlus className="size-4" />
      )}
      {label && size === 'md' && <span className="text-[0.7rem]">{label}</span>}
    </button>
  );
}

interface SingleImageUploadProps {
  /** Current image URL ('' = none). */
  value: string;
  onChange: (url: string) => void;
  size?: 'sm' | 'md';
}

/** One-image picker (thumbnail, variant photo): upload from device, no URL input. */
export function SingleImageUpload({
  value,
  onChange,
  size = 'md',
}: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {value ? (
        <ImageTile url={value} onRemove={() => onChange('')} size={size} />
      ) : (
        <AddTile
          uploading={uploading}
          onPick={() => inputRef.current?.click()}
          size={size}
          label="Chọn ảnh"
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setUploading(true);
          const [url] = await uploadFiles([file]);
          setUploading(false);
          if (url) onChange(url);
        }}
      />
    </div>
  );
}

interface MultiImageUploadProps {
  /** Current gallery URLs. */
  value: string[];
  onChange: (urls: string[]) => void;
}

/** Multi-image picker (product gallery): upload from device, no URL input. */
export function MultiImageUpload({ value, onChange }: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((url, i) => (
        <ImageTile
          key={`${url}-${i}`}
          url={url}
          onRemove={() => onChange(value.filter((_, idx) => idx !== i))}
        />
      ))}
      <AddTile
        uploading={uploading}
        onPick={() => inputRef.current?.click()}
        label="Thêm ảnh"
      />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          if (!files.length) return;
          setUploading(true);
          const urls = await uploadFiles(files);
          setUploading(false);
          if (urls.length) onChange([...value, ...urls]);
        }}
      />
    </div>
  );
}
