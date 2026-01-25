import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function LoadingSpinner({ 
  size = 'md', 
  className = '',
  text = 'Loading...' 
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn(sizes[size], "animate-spin text-violet-600")} />
      {text && <p className="text-sm text-slate-500 animate-pulse">{text}</p>}
    </div>
  );
}