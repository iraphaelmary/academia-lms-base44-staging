import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, ChevronRight, Menu, X, CheckCircle, 
  FileText, Download, MessageSquare, BookOpen
} from 'lucide-react';
import LessonPlayer from '../components/learning/LessonPlayer';
import CourseSidebar from '../components/learning/CourseSidebar';
import ProgressTracker from '../components/learning/ProgressTracker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { sanitizePlainText, sanitizeInput, createAuditEntry } from '../components/security/SecurityUtils';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function LearnPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  const lessonId = urlParams.get('lessonId');
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  // Fetch course
  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => base44.entities.Course.filter({ id: courseId }),
    select: (data) => data[0],
    enabled: !!courseId
  });

  // Fetch enrollment
  const { data: enrollment, isLoading: loadingEnrollment } = useQuery({
    queryKey: ['enrollment', courseId, user?.id],
    queryFn: () => base44.entities.Enrollment.filter({ course_id: courseId, user_id: user?.id }),
    select: (data) => data[0],
    enabled: !!courseId && !!user?.id
  });

  // Fetch sections and lessons
  const { data: sections = [], isLoading: loadingSections } = useQuery({
    queryKey: ['sections', courseId],
    queryFn: async () => {
      const sectionsList = await base44.entities.Section.filter({ course_id: courseId }, 'order');
      const lessonsData = await base44.entities.Lesson.filter({ course_id: courseId }, 'order');
      
      return sectionsList.map(section => ({
        ...section,
        lessons: lessonsData.filter(l => l.section_id === section.id).sort((a, b) => a.order - b.order)
      }));
    },
    enabled: !!courseId
  });

  // All lessons flat
  const allLessons = useMemo(() => {
    return sections.flatMap(s => s.lessons || []);
  }, [sections]);

  // Set initial lesson
  useEffect(() => {
    if (allLessons.length > 0 && !currentLesson) {
      if (lessonId) {
        const lesson = allLessons.find(l => l.id === lessonId);
        if (lesson) {
          setCurrentLesson(lesson);
          return;
        }
      }
      
      // Resume from last accessed or start from beginning
      if (enrollment?.last_accessed_lesson_id) {
        const lastLesson = allLessons.find(l => l.id === enrollment.last_accessed_lesson_id);
        if (lastLesson) {
          setCurrentLesson(lastLesson);
          return;
        }
      }
      
      setCurrentLesson(allLessons[0]);
    }
  }, [allLessons, lessonId, enrollment, currentLesson]);

  // Mark lesson complete mutation
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId) => {
      if (!enrollment) return;
      
      const completedLessons = [...(enrollment.completed_lessons || [])];
      if (completedLessons.includes(lessonId)) return;
      
      completedLessons.push(lessonId);
      
      const progress = (completedLessons.length / allLessons.length) * 100;
      const isComplete = progress >= 100;
      
      await base44.entities.Enrollment.update(enrollment.id, {
        completed_lessons: completedLessons,
        progress_percentage: progress,
        last_accessed_lesson_id: lessonId,
        last_accessed_at: new Date().toISOString(),
        status: isComplete ? 'completed' : 'active',
        completed_at: isComplete ? new Date().toISOString() : null
      });

      // Audit log
      await base44.entities.AuditLog.create(
        createAuditEntry('complete_lesson', 'lesson', lessonId, { 
          course_id: courseId,
          progress 
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['enrollment', courseId]);
      toast.success('Lesson completed!');
    }
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async () => {
      if (!enrollment || !currentLesson) return;
      
      await base44.entities.Enrollment.update(enrollment.id, {
        last_accessed_lesson_id: currentLesson.id,
        last_accessed_at: new Date().toISOString()
      });
    }
  });

  // Navigate to lesson
  const navigateToLesson = (lesson) => {
    setCurrentLesson(lesson);
    updateProgressMutation.mutate();
    
    // Update URL without reload
    const newUrl = `${window.location.pathname}?courseId=${courseId}&lessonId=${lesson.id}`;
    window.history.replaceState(null, '', newUrl);
  };

  // Get next/prev lesson
  const currentIndex = currentLesson ? allLessons.findIndex(l => l.id === currentLesson.id) : -1;
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Handle lesson completion
  const handleLessonComplete = () => {
    if (currentLesson && enrollment) {
      completeLessonMutation.mutate(currentLesson.id);
    }
  };

  const isLoading = loadingCourse || loadingEnrollment || loadingSections;
  const isCompleted = enrollment?.completed_lessons?.includes(currentLesson?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner size="lg" text="Loading course..." />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <EmptyState 
          icon={BookOpen}
          title="Not enrolled"
          description="You need to enroll in this course to access the content."
          action={
            <Link to={createPageUrl(`CourseDetails?id=${courseId}`)}>
              <Button>View Course</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-white transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden"
      )}>
        {/* Sidebar Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4">
          <Link to={createPageUrl(`CourseDetails?id=${courseId}`)} className="flex items-center gap-2 text-violet-600 hover:text-violet-700">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Course</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Course Title */}
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900 line-clamp-2">
            {sanitizePlainText(course?.title)}
          </h2>
        </div>

        {/* Curriculum */}
        <div className="flex-1 overflow-y-auto">
          <CourseSidebar
            sections={sections}
            currentLessonId={currentLesson?.id}
            completedLessons={enrollment?.completed_lessons || []}
            isEnrolled={true}
            onSelectLesson={navigateToLesson}
            progress={enrollment?.progress_percentage || 0}
          />
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-slate-700"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-white font-medium truncate max-w-md">
              {sanitizePlainText(currentLesson?.title)}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <span className="flex items-center gap-1 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 bg-black flex items-center justify-center p-4">
          {currentLesson?.type === 'video' ? (
            <LessonPlayer
              videoUrl={currentLesson.video_url}
              title={currentLesson.title}
              onComplete={handleLessonComplete}
              className="max-w-5xl w-full"
            />
          ) : currentLesson?.type === 'article' ? (
            <div className="max-w-3xl w-full bg-white rounded-2xl p-8 max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {sanitizePlainText(currentLesson.title)}
              </h2>
              <div 
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeInput(currentLesson.content || '') }}
              />
              <Button 
                onClick={handleLessonComplete}
                disabled={isCompleted}
                className="mt-8 bg-violet-600 hover:bg-violet-700"
              >
                {isCompleted ? 'Completed' : 'Mark as Complete'}
              </Button>
            </div>
          ) : (
            <div className="text-center text-white">
              <p>Content not available</p>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="h-20 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-6">
          <Button
            variant="ghost"
            onClick={() => prevLesson && navigateToLesson(prevLesson)}
            disabled={!prevLesson}
            className="text-white hover:bg-slate-700"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            {!isCompleted && (
              <Button
                variant="outline"
                onClick={handleLessonComplete}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>

          <Button
            onClick={() => nextLesson && navigateToLesson(nextLesson)}
            disabled={!nextLesson}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Lesson Details Tabs */}
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <Tabs defaultValue="overview">
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">About this lesson</h3>
                  <p className="text-slate-600">
                    {sanitizePlainText(currentLesson?.description) || 'No description available'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  {currentLesson?.resources?.length > 0 ? (
                    <div className="space-y-3">
                      {currentLesson.resources.map((resource, i) => (
                        <a
                          key={i}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Download className="w-5 h-5 text-violet-500" />
                          <span className="text-slate-700">{sanitizePlainText(resource.title)}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No resources for this lesson</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <p className="text-slate-500">Notes feature coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}