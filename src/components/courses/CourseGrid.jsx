import React from 'react';
import CourseCard from './CourseCard';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { BookOpen } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function CourseGrid({ 
  courses, 
  isLoading,
  emptyTitle = "No courses found",
  emptyDescription = "We couldn't find any courses matching your criteria.",
  emptyAction,
  className = ''
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Loading courses..." />
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
      className
    )}>
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}