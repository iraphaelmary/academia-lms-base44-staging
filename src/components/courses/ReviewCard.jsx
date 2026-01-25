import React from 'react';
import { ThumbsUp, Flag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import RatingStars from './RatingStars';
import SecureImage from '../ui/SecureImage';
import { sanitizePlainText, escapeHtml } from '../security/SecurityUtils';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function ReviewCard({ 
  review, 
  onHelpful,
  onReport,
  className = '' 
}) {
  const {
    user_name,
    user_avatar,
    rating,
    title,
    content,
    created_date,
    helpful_count,
    is_verified_purchase,
    instructor_response,
    instructor_response_at
  } = review;

  return (
    <div className={cn("border-b border-slate-100 pb-6 mb-6 last:border-0", className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <SecureImage
            src={user_avatar}
            alt={sanitizePlainText(user_name)}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                {sanitizePlainText(user_name)}
              </span>
              {is_verified_purchase && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <RatingStars rating={rating} size="sm" showValue={false} />
              <span className="text-xs text-slate-400">
                {created_date && format(new Date(created_date), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {title && (
        <h4 className="font-semibold text-slate-900 mb-2">
          {sanitizePlainText(title)}
        </h4>
      )}
      <p className="text-slate-600 leading-relaxed mb-4">
        {sanitizePlainText(content)}
      </p>

      {/* Instructor Response */}
      {instructor_response && (
        <div className="bg-slate-50 rounded-xl p-4 mb-4 border-l-4 border-violet-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-violet-600">Instructor Response</span>
            {instructor_response_at && (
              <span className="text-xs text-slate-400">
                {format(new Date(instructor_response_at), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">
            {sanitizePlainText(instructor_response)}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onHelpful?.(review.id)}
          className="text-slate-500 hover:text-violet-600"
        >
          <ThumbsUp className="w-4 h-4 mr-1" />
          Helpful ({helpful_count || 0})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReport?.(review.id)}
          className="text-slate-400 hover:text-rose-500"
        >
          <Flag className="w-4 h-4 mr-1" />
          Report
        </Button>
      </div>
    </div>
  );
}