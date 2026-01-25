import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Clock, BookOpen, Award, Search, Grid, List, 
  Trophy, GraduationCap, BarChart, ChevronRight
} from 'lucide-react';
import SecureImage from '../components/ui/SecureImage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import SearchBar from '../components/courses/SearchBar';
import { sanitizePlainText } from '../components/security/SecurityUtils';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function MyLearningPage() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  // Fetch enrollments
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: () => base44.entities.Enrollment.filter({ user_id: user?.id }, '-enrolled_at'),
    enabled: !!user?.id
  });

  // Fetch enrolled courses
  const { data: courses = [] } = useQuery({
    queryKey: ['enrolled-courses', enrollments.map(e => e.course_id)],
    queryFn: async () => {
      if (enrollments.length === 0) return [];
      const courseIds = enrollments.map(e => e.course_id);
      const allCourses = await base44.entities.Course.list('-created_date', 100);
      return allCourses.filter(c => courseIds.includes(c.id));
    },
    enabled: enrollments.length > 0
  });

  // Combine enrollments with course data
  const enrolledCourses = enrollments.map(enrollment => {
    const course = courses.find(c => c.id === enrollment.course_id);
    return { ...enrollment, course };
  }).filter(e => e.course);

  // Filter by status and search
  const filterCourses = (status) => {
    let filtered = enrolledCourses;
    
    if (status === 'in-progress') {
      filtered = filtered.filter(e => e.status === 'active' && (e.progress_percentage || 0) > 0);
    } else if (status === 'not-started') {
      filtered = filtered.filter(e => (e.progress_percentage || 0) === 0);
    } else if (status === 'completed') {
      filtered = filtered.filter(e => e.status === 'completed');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.course?.title?.toLowerCase().includes(query) ||
        e.course?.instructor_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Stats
  const stats = {
    total: enrolledCourses.length,
    inProgress: enrolledCourses.filter(e => e.status === 'active' && (e.progress_percentage || 0) > 0).length,
    completed: enrolledCourses.filter(e => e.status === 'completed').length,
    certificates: enrolledCourses.filter(e => e.certificate_issued).length
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const CourseCard = ({ enrollment }) => {
    const { course, progress_percentage, last_accessed_at, status, certificate_issued } = enrollment;
    const isCompleted = status === 'completed';

    return (
      <Link 
        to={createPageUrl(isCompleted ? `CourseDetails?id=${course.id}` : `Learn?courseId=${course.id}`)}
        className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300"
      >
        <div className="relative aspect-video">
          <SecureImage
            src={course.thumbnail_url}
            alt={sanitizePlainText(course.title)}
            className="w-full h-full object-cover"
          />
          {!isCompleted && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                <Play className="w-7 h-7 text-violet-600 ml-1" />
              </div>
            </div>
          )}
          {isCompleted && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-emerald-500 text-white">
                <Trophy className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-violet-600 transition-colors">
            {sanitizePlainText(course.title)}
          </h3>
          
          <p className="text-sm text-slate-500 mb-4">
            {sanitizePlainText(course.instructor_name)}
          </p>

          {/* Progress */}
          {!isCompleted && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">{Math.round(progress_percentage || 0)}% complete</span>
                <span className="text-slate-400">{formatDuration(course.total_duration_minutes)}</span>
              </div>
              <Progress value={progress_percentage || 0} className="h-2" />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-sm">
            {last_accessed_at ? (
              <span className="text-slate-400">
                Last accessed {format(new Date(last_accessed_at), 'MMM d')}
              </span>
            ) : (
              <span className="text-slate-400">Not started</span>
            )}
            
            {certificate_issued && (
              <Badge variant="secondary" className="text-violet-600">
                <Award className="w-3 h-3 mr-1" />
                Certificate
              </Badge>
            )}
          </div>
        </div>
      </Link>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">My Learning</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: BookOpen, label: 'Enrolled', value: stats.total, color: 'bg-violet-100 text-violet-600' },
              { icon: BarChart, label: 'In Progress', value: stats.inProgress, color: 'bg-blue-100 text-blue-600' },
              { icon: Trophy, label: 'Completed', value: stats.completed, color: 'bg-emerald-100 text-emerald-600' },
              { icon: Award, label: 'Certificates', value: stats.certificates, color: 'bg-amber-100 text-amber-600' }
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchBar
              value={searchQuery}
              onSearch={setSearchQuery}
              placeholder="Search your courses..."
              className="flex-1 max-w-md"
            />
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading your courses..." />
        ) : enrolledCourses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No courses yet"
            description="Start your learning journey by enrolling in a course"
            action={
              <Link to={createPageUrl('Courses')}>
                <Button className="bg-violet-600 hover:bg-violet-700">
                  Browse Courses
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            }
          />
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="bg-white border border-slate-200 mb-8">
              <TabsTrigger value="all">All Courses ({stats.total})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({stats.inProgress})</TabsTrigger>
              <TabsTrigger value="not-started">Not Started ({stats.total - stats.inProgress - stats.completed})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
            </TabsList>

            {['all', 'in-progress', 'not-started', 'completed'].map(tab => (
              <TabsContent key={tab} value={tab}>
                {filterCourses(tab).length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No courses found"
                    description={searchQuery ? "Try a different search term" : "No courses in this category"}
                  />
                ) : (
                  <div className={cn(
                    viewMode === 'grid' 
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      : "space-y-4"
                  )}>
                    {filterCourses(tab).map((enrollment) => (
                      <CourseCard key={enrollment.id} enrollment={enrollment} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}