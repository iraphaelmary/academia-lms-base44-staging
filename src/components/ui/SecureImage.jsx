import React, { useState } from 'react';
import { validateUrl } from '../security/SecurityUtils';
import { ImageOff } from 'lucide-react';
import { cn } from "@/lib/utils";

// Secure Image Component with URL validation and fallback
export default function SecureImage({ 
  src, 
  alt = '', 
  className = '', 
  fallback = null,
  ...props 
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Validate URL before rendering
  const isValidSrc = src && (
    validateUrl(src) || 
    src.startsWith('/') || 
    src.startsWith('data:image/')
  );

  if (!isValidSrc || error) {
    return fallback || (
      <div 
        className={cn(
          "bg-slate-100 flex items-center justify-center text-slate-400",
          className
        )}
        {...props}
      >
        <ImageOff className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
}