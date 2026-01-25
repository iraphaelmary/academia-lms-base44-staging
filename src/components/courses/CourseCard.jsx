import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Users, PlayCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import SecureImage from '../ui/SecureImage';
import { sanitizePlainText } from '../security/SecurityUtils';
import { cn } from "@/lib/utils";

export default function CourseCard({ course, className = '' }) {
  const {
    id,
    title,
    short_description,
    thumbnail_url,
    instructor_name,
    instructor_avatar,
    price,
    original_price,
    is_free,
    average_rating,
    total_ratings,
    total_students,
    total_duration_minutes,
    level,
    category
  } = course;

  const formatDuration = (minutes) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const levelColors = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-rose-100 text-rose-700',
    all_levels: 'bg-violet-100 text-violet-700'
  };

  return (
    <Link 
      to={createPageUrl(`CourseDetails?id=${id}`)}
      className={cn(
        "group block bg-white rounded-2xl overflow-hidden border border-slate-200/60",
        "hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/60",
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <SecureImage
          src={thumbnail_url}
          alt={sanitizePlainText(title)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-violet-600" />
            </div>
          </div>
        </div>
        
        {/* Level Badge */}
        {level && (
          <Badge className={cn(
            "absolute top-3 left-3 text-xs font-medium",
            levelColors[level] || levelColors.all_levels
          )}>
            {level.replace('_', ' ')}
          </Badge>
        )}
        
        {/* Duration */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(total_duration_minutes)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        <p className="text-xs font-medium text-violet-600 uppercase tracking-wide mb-2">
          {category?.replace('_', ' ')}
        </p>
        
        {/* Title */}
        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-violet-600 transition-colors">
          {sanitizePlainText(title)}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
          {sanitizePlainText(short_description)}
        </p>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-4">
          <SecureImage
            src={instructor_avatar}
            alt={sanitizePlainText(instructor_name)}
            className="w-7 h-7 rounded-full object-cover"
          />
          <span className="text-sm text-slate-600">{sanitizePlainText(instructor_name)}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-semibold text-slate-900">{average_rating?.toFixed(1) || '0.0'}</span>
            <span className="text-slate-400">({total_ratings || 0})</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Users className="w-4 h-4" />
            <span>{total_students?.toLocaleString() || 0}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
          {is_free ? (
            <span className="text-lg font-bold text-emerald-600">Free</span>
          ) : (
            <>
              <span className="text-lg font-bold text-slate-900">{formatPrice(price || 0)}</span>
              {original_price && original_price > price && (
                <span className="text-sm text-slate-400 line-through">{formatPrice(original_price)}</span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}