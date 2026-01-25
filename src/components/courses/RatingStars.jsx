import React from 'react';
import { Star } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function RatingStars({ 
  rating = 0, 
  size = 'md',
  showValue = true,
  interactive = false,
  onRate,
  className = ''
}) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const handleClick = (index) => {
    if (interactive && onRate) {
      onRate(index + 1);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, index) => {
          const filled = index < Math.floor(rating);
          const partial = !filled && index < rating;
          
          return (
            <button
              key={index}
              onClick={() => handleClick(index)}
              disabled={!interactive}
              className={cn(
                "relative",
                interactive && "cursor-pointer hover:scale-110 transition-transform"
              )}
              aria-label={`Rate ${index + 1} stars`}
            >
              <Star
                className={cn(
                  sizes[size],
                  filled 
                    ? "text-amber-400 fill-amber-400" 
                    : "text-slate-300"
                )}
              />
              {partial && (
                <Star
                  className={cn(
                    sizes[size],
                    "absolute inset-0 text-amber-400 fill-amber-400"
                  )}
                  style={{ 
                    clipPath: `inset(0 ${100 - (rating % 1) * 100}% 0 0)` 
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={cn("font-semibold text-slate-900 ml-1", textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}