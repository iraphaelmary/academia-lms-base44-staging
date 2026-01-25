import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Play, FileText, HelpCircle, CheckCircle, Lock, Clock } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { sanitizePlainText } from '../security/SecurityUtils';
import { cn } from "@/lib/utils";

export default function CourseSidebar({ 
  sections = [], 
  currentLessonId,
  completedLessons = [],
  isEnrolled,
  onSelectLesson,
  progress = 0,
  className = '' 
}) {
  const [expandedSections, setExpandedSections] = useState(
    sections.map((_, i) => i === 0) // First section expanded by default
  );

  const toggleSection = (index) => {
    setExpandedSections(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const lessonTypeIcons = {
    video: Play,
    article: FileText,
    quiz: HelpCircle
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 overflow-hidden", className)}>
      {/* Progress Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Course Progress</span>
          <span className="text-sm font-semibold text-violet-600">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Sections */}
      <div className="divide-y divide-slate-100">
        {sections.map((section, sectionIndex) => (
          <div key={section.id}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(sectionIndex)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-slate-900 text-sm">
                  Section {sectionIndex + 1}: {sanitizePlainText(section.title)}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {section.lessons?.length || 0} lessons • {formatDuration(section.total_duration_minutes)}
                </p>
              </div>
              {expandedSections[sectionIndex] ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {/* Lessons */}
            {expandedSections[sectionIndex] && (
              <div className="bg-slate-50/50">
                {section.lessons?.map((lesson, lessonIndex) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isCurrent = lesson.id === currentLessonId;
                  const canAccess = isEnrolled || lesson.is_preview;
                  const Icon = lessonTypeIcons[lesson.type] || Play;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => canAccess && onSelectLesson(lesson)}
                      disabled={!canAccess}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left",
                        "transition-colors border-l-2",
                        isCurrent 
                          ? "bg-violet-50 border-l-violet-500" 
                          : "border-l-transparent hover:bg-slate-100",
                        !canAccess && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {/* Status Icon */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        isCompleted 
                          ? "bg-emerald-100 text-emerald-600"
                          : isCurrent
                            ? "bg-violet-100 text-violet-600"
                            : "bg-slate-100 text-slate-400"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : canAccess ? (
                          <Icon className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm truncate",
                          isCurrent ? "font-medium text-violet-700" : "text-slate-700"
                        )}>
                          {sectionIndex + 1}.{lessonIndex + 1} {sanitizePlainText(lesson.title)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 capitalize">{lesson.type}</span>
                          {lesson.video_duration_minutes && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(lesson.video_duration_minutes)}
                              </span>
                            </>
                          )}
                          {lesson.is_preview && !isEnrolled && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs font-medium text-violet-600">Preview</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}