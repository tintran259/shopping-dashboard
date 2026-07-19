import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

/** Xem phóng to ảnh feedback của khách, lật qua lại nếu có nhiều ảnh. */
export function ReviewImageLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[] | null;
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const open = !!images && images.length > 0;
  const count = images?.length ?? 0;

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Ảnh đánh giá</DialogTitle>
        {open && (
          <div className="relative flex items-center justify-center">
            <img
              src={images![index]}
              alt={`Ảnh đánh giá ${index + 1}`}
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />

            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Ảnh trước"
                  onClick={() => go(-1)}
                  className="absolute left-2 flex size-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Ảnh sau"
                  onClick={() => go(1)}
                  className="absolute right-2 flex size-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="size-5" />
                </button>
                <span className="absolute bottom-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white tabular-nums">
                  {index + 1} / {count}
                </span>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
