import React from 'react';
import { Trophy, Clock, BookOpen, Award } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function ProgressTracker({ 
  enrollment,
  totalLessons,
  totalDuration,
  className = '' 
}) {
  const {
    progress_percentage = 0,
    completed_lessons = [],
    status,
    certificate_issued
  } = enrollment || {};

  const completedCount = completed_lessons?.length || 0;

  const formatDuration = (minutes) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const stats = [
    {
      icon: BookOpen,
      label: 'Lessons',
      value: `${completedCount}/${totalLessons}`,
      color: 'text-violet-600 bg-violet-100'
    },
    {
      icon: Clock,
      label: 'Total Duration',
      value: formatDuration(totalDuration),
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: Trophy,
      label: 'Progress',
      value: `${Math.round(progress_percentage)}%`,
      color: 'text-amber-600 bg-amber-100'
    },
    {
      icon: Award,
      label: 'Certificate',
      value: certificate_issued ? 'Earned' : 'Pending',
      color: certificate_issued ? 'text-emerald-600 bg-emerald-100' : 'text-slate-400 bg-slate-100'
    }
  ];

  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 p-6", className)}>
      <h3 className="font-semibold text-slate-900 mb-4">Your Progress</h3>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Course Completion</span>
          <span className="text-sm font-semibold text-violet-600">{Math.round(progress_percentage)}%</span>
        </div>
        <Progress value={progress_percentage} className="h-3" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {status === 'completed' && (
        <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800">Congratulations!</p>
              <p className="text-sm text-emerald-600">You've completed this course</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}