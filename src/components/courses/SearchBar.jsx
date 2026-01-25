import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sanitizePlainText, checkRateLimit } from '../security/SecurityUtils';
import { cn } from "@/lib/utils";
import { debounce } from 'lodash';

export default function SearchBar({ 
  value = '', 
  onSearch, 
  placeholder = 'Search courses...',
  className = '' 
}) {
  const [localValue, setLocalValue] = useState(value);
  const [rateLimited, setRateLimited] = useState(false);

  // Debounced search with rate limiting
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      const { allowed, remaining } = checkRateLimit('search', 30, 60000);
      
      if (!allowed) {
        setRateLimited(true);
        setTimeout(() => setRateLimited(false), 5000);
        return;
      }
      
      // Sanitize input before searching (XSS prevention)
      const sanitized = sanitizePlainText(searchValue.trim());
      onSearch(sanitized);
    }, 300),
    [onSearch]
  );

  const handleChange = (e) => {
    const newValue = e.target.value;
    // Limit input length (prevent DoS)
    if (newValue.length > 100) return;
    
    setLocalValue(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onSearch('');
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "pl-12 pr-12 py-6 text-base rounded-xl border-slate-200",
            "focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500",
            "placeholder:text-slate-400",
            rateLimited && "border-amber-400"
          )}
          maxLength={100}
          aria-label="Search courses"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {rateLimited && (
        <p className="text-xs text-amber-600 mt-2">
          Too many searches. Please wait a moment.
        </p>
      )}
    </div>
  );
}