import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Dải 5 sao (tô theo `rating`). Dùng ở bảng đánh giá & dialog phản hồi. */
export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating}/5 sao`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/30',
          )}
        />
      ))}
    </span>
  );
}
