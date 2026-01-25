import React from 'react';
import { cn } from "@/lib/utils";
import { 
  Code, Briefcase, Palette, Megaphone, Camera, 
  Music, Heart, DollarSign, GraduationCap, Sparkles, Grid3X3
} from 'lucide-react';

const categoryIcons = {
  all: Grid3X3,
  development: Code,
  business: Briefcase,
  design: Palette,
  marketing: Megaphone,
  photography: Camera,
  music: Music,
  health: Heart,
  finance: DollarSign,
  teaching: GraduationCap,
  lifestyle: Sparkles
};

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'development', label: 'Development' },
  { value: 'business', label: 'Business' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'photography', label: 'Photography' },
  { value: 'music', label: 'Music' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'finance', label: 'Finance' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'lifestyle', label: 'Lifestyle' }
];

export default function CategoryFilter({ selectedCategory, onSelect, className = '' }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((category) => {
        const Icon = categoryIcons[category.value];
        const isSelected = selectedCategory === category.value;
        
        return (
          <button
            key={category.value}
            onClick={() => onSelect(category.value)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
              "transition-all duration-200 ease-out",
              isSelected
                ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-600"
            )}
          >
            <Icon className="w-4 h-4" />
            {category.label}
          </button>
        );
      })}
    </div>
  );
}