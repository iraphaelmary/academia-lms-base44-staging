import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Play, Clock, Users, Star, Award, Globe, BarChart, 
  CheckCircle, ChevronRight, Share2, Heart, AlertCircle,
  PlayCircle, FileText, Download, Lock
} from 'lucide-react';
import RatingStars from '../components/courses/RatingStars';
import ReviewCard from '../components/courses/ReviewCard';
import SecureImage from '../components/ui/SecureImage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { sanitizePlainText, sanitizeInput, createAuditEntry } from '../components/security/SecurityUtils';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function CourseDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch course details
  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => base44.entities.Course.filter({ id: courseId }),
    select: (data) => data[0],
    enabled: !!courseId
  });

  // Fetch sections and lessons
  const { data: sections = [], isLoading: loadingSections } = useQuery({
    queryKey: ['sections', courseId],
    queryFn: async () => {
      const sectionsList = await base44.entities.Section.filter({ course_id: courseId }, 'order');
      const lessonsData = await base44.entities.Lesson.filter({ course_id: courseId }, 'order');
      
      return sectionsList.map(section => ({
        ...section,
        lessons: lessonsData.filter(l => l.section_id === section.id)
      }));
    },
    enabled: !!courseId
  });

  // Check enrollment
  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', courseId, user?.id],
    queryFn: () => base44.entities.Enrollment.filter({ course_id: courseId, user_id: user?.id }),
    select: (data) => data[0],
    enabled: !!courseId && !!user?.id
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', courseId],
    queryFn: () => base44.entities.Review.filter({ course_id: courseId }, '-created_date', 20),
    enabled: !!courseId
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      
      const enrollmentData = {
        user_id: user.id,
        user_email: user.email,
        course_id: courseId,
        course_title: course.title,
        enrolled_at: new Date().toISOString(),
        status: 'active',
        progress_percentage: 0,
        completed_lessons: [],
        payment_amount: course.is_free ? 0 : course.price
      };
      
      await base44.entities.Enrollment.create(enrollmentData);
      
      // Log audit entry
      await base44.entities.AuditLog.create(
        createAuditEntry('enroll', 'enrollment', courseId, { course_title: course.title })
      );
      
      // Update course student count
      await base44.entities.Course.update(courseId, {
        total_students: (course.total_students || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['enrollment', courseId]);
      toast.success('Successfully enrolled!');
    }
  });

  if (loadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading course..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen">
        <EmptyState 
          icon={AlertCircle}
          title="Course not found"
          description="The course you're looking for doesn't exist or has been removed."
          action={
            <Link to={createPageUrl('Courses')}>
              <Button>Browse Courses</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isEnrolled = !!enrollment;
  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);

  const formatDuration = (minutes) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                <Link to={createPageUrl('Home')} className="hover:text-white transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <Link to={createPageUrl('Courses')} className="hover:text-white transition-colors">Courses</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">{sanitizePlainText(course.category)?.replace('_', ' ')}</span>
              </nav>

              <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                {sanitizePlainText(course.title)}
              </h1>
              
              <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                {sanitizePlainText(course.short_description)}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <RatingStars rating={course.average_rating || 0} size="md" />
                  <span className="text-slate-300">({course.total_ratings || 0} ratings)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-5 h-5" />
                  <span>{(course.total_students || 0).toLocaleString()} students</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3 mb-6">
                <SecureImage 
                  src={course.instructor_avatar}
                  alt={sanitizePlainText(course.instructor_name)}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm text-slate-400">Created by</p>
                  <p className="font-medium">{sanitizePlainText(course.instructor_name)}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last updated {course.last_updated_at ? format(new Date(course.last_updated_at), 'MMM yyyy') : 'Recently'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>{course.language || 'English'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4" />
                  <span className="capitalize">{course.level?.replace('_', ' ') || 'All levels'}</span>
                </div>
              </div>
            </div>

            {/* Purchase Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden sticky top-24">
                {/* Preview Image */}
                <div className="relative aspect-video">
                  <SecureImage 
                    src={course.thumbnail_url}
                    alt={sanitizePlainText(course.title)}
                    className="w-full h-full object-cover"
                  />
                  {course.preview_video_url && (
                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                        <PlayCircle className="w-10 h-10 text-violet-600" />
                      </div>
                    </button>
                  )}
                </div>

                <div className="p-6">
                  {/* Price */}
                  <div className="flex items-center gap-3 mb-6">
                    {course.is_free ? (
                      <span className="text-3xl font-bold text-emerald-600">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-slate-900">
                          ${course.price?.toFixed(2)}
                        </span>
                        {course.original_price && course.original_price > course.price && (
                          <>
                            <span className="text-lg text-slate-400 line-through">
                              ${course.original_price?.toFixed(2)}
                            </span>
                            <Badge className="bg-rose-100 text-rose-700">
                              {Math.round((1 - course.price / course.original_price) * 100)}% off
                            </Badge>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isEnrolled ? (
                    <Link to={createPageUrl(`Learn?courseId=${courseId}`)}>
                      <Button className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-lg mb-3">
                        <Play className="w-5 h-5 mr-2" />
                        Continue Learning
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-lg mb-3"
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending ? 'Enrolling...' : course.is_free ? 'Enroll for Free' : 'Buy Now'}
                    </Button>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 py-5">
                      <Heart className="w-4 h-4 mr-2" />
                      Wishlist
                    </Button>
                    <Button variant="outline" className="flex-1 py-5">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  {/* Course Includes */}
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-4">This course includes:</h4>
                    <ul className="space-y-3 text-sm text-slate-600">
                      <li className="flex items-center gap-3">
                        <Play className="w-4 h-4 text-violet-500" />
                        {formatDuration(course.total_duration_minutes)} on-demand video
                      </li>
                      <li className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-violet-500" />
                        {totalLessons} lessons
                      </li>
                      <li className="flex items-center gap-3">
                        <Download className="w-4 h-4 text-violet-500" />
                        Downloadable resources
                      </li>
                      <li className="flex items-center gap-3">
                        <Award className="w-4 h-4 text-violet-500" />
                        Certificate of completion
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                <TabsTrigger value="curriculum" className="rounded-lg">Curriculum</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-lg">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                {/* Learning Objectives */}
                {course.learning_objectives?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">What you'll learn</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {course.learning_objectives.map((obj, i) => (
                        <div key={i} className="flex gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-600">{sanitizePlainText(obj)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Description</h3>
                  <div 
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeInput(course.description || '') }}
                  />
                </div>

                {/* Requirements */}
                {course.requirements?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Requirements</h3>
                    <ul className="space-y-2">
                      {course.requirements.map((req, i) => (
                        <li key={i} className="flex gap-3 text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                          {sanitizePlainText(req)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="curriculum">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-slate-900">Course Content</h3>
                      <p className="text-sm text-slate-500">
                        {sections.length} sections • {totalLessons} lessons • {formatDuration(course.total_duration_minutes)}
                      </p>
                    </div>
                  </div>

                  <Accordion type="multiple" defaultValue={['section-0']}>
                    {sections.map((section, sectionIndex) => (
                      <AccordionItem key={section.id} value={`section-${sectionIndex}`}>
                        <AccordionTrigger className="px-6 hover:bg-slate-50">
                          <div className="flex-1 text-left">
                            <span className="font-semibold">Section {sectionIndex + 1}: {sanitizePlainText(section.title)}</span>
                            <span className="ml-4 text-sm text-slate-500">
                              {section.lessons?.length || 0} lessons • {formatDuration(section.total_duration_minutes)}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="px-6 pb-4 space-y-1">
                            {section.lessons?.map((lesson, lessonIndex) => (
                              <div 
                                key={lesson.id}
                                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50"
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.is_preview || isEnrolled ? (
                                    <Play className="w-4 h-4 text-violet-500" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-slate-400" />
                                  )}
                                  <span className="text-slate-700">
                                    {sectionIndex + 1}.{lessonIndex + 1} {sanitizePlainText(lesson.title)}
                                  </span>
                                  {lesson.is_preview && !isEnrolled && (
                                    <Badge variant="secondary" className="text-xs">Preview</Badge>
                                  )}
                                </div>
                                <span className="text-sm text-slate-500">
                                  {formatDuration(lesson.video_duration_minutes)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">Student Reviews</h3>
                    <div className="flex items-center gap-2">
                      <RatingStars rating={course.average_rating || 0} size="lg" />
                      <span className="text-slate-500">({course.total_ratings || 0} reviews)</span>
                    </div>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {reviews.map((review) => (
                        <ReviewCard 
                          key={review.id} 
                          review={review}
                          onHelpful={() => {}}
                          onReport={() => {}}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">No reviews yet</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar placeholder for mobile */}
          <div className="lg:hidden" />
        </div>
      </div>
    </div>
  );
}