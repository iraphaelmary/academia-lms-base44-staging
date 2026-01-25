import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Users, DollarSign, Star, BookOpen, TrendingUp,
  Eye, Edit, MoreVertical, BarChart3, Award
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import SecureImage from '../components/ui/SecureImage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { sanitizePlainText } from '../components/security/SecurityUtils';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function InstructorDashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  // Fetch instructor's courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['instructor-courses', user?.id],
    queryFn: () => base44.entities.Course.filter({ instructor_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  // Fetch enrollments for instructor's courses
  const { data: enrollments = [] } = useQuery({
    queryKey: ['instructor-enrollments', courses.map(c => c.id)],
    queryFn: async () => {
      if (courses.length === 0) return [];
      const allEnrollments = [];
      for (const course of courses) {
        const courseEnrollments = await base44.entities.Enrollment.filter({ course_id: course.id }, '-enrolled_at', 100);
        allEnrollments.push(...courseEnrollments);
      }
      return allEnrollments;
    },
    enabled: courses.length > 0
  });

  // Fetch reviews for instructor's courses
  const { data: reviews = [] } = useQuery({
    queryKey: ['instructor-reviews', courses.map(c => c.id)],
    queryFn: async () => {
      if (courses.length === 0) return [];
      const allReviews = [];
      for (const course of courses) {
        const courseReviews = await base44.entities.Review.filter({ course_id: course.id }, '-created_date', 50);
        allReviews.push(...courseReviews);
      }
      return allReviews;
    },
    enabled: courses.length > 0
  });

  // Calculate stats
  const stats = {
    totalStudents: courses.reduce((acc, c) => acc + (c.total_students || 0), 0),
    totalRevenue: enrollments.reduce((acc, e) => acc + (e.payment_amount || 0), 0),
    averageRating: courses.length > 0 
      ? courses.reduce((acc, c) => acc + (c.average_rating || 0), 0) / courses.length 
      : 0,
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.status === 'published').length
  };

  // Mock chart data
  const enrollmentData = [
    { month: 'Jan', students: 45 },
    { month: 'Feb', students: 52 },
    { month: 'Mar', students: 78 },
    { month: 'Apr', students: 91 },
    { month: 'May', students: 86 },
    { month: 'Jun', students: 112 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 1200 },
    { month: 'Feb', revenue: 1800 },
    { month: 'Mar', revenue: 2400 },
    { month: 'Apr', revenue: 2100 },
    { month: 'May', revenue: 2800 },
    { month: 'Jun', revenue: 3200 }
  ];

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    pending_review: 'bg-amber-100 text-amber-700',
    published: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-rose-100 text-rose-700'
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Instructor Dashboard</h1>
              <p className="text-slate-600 mt-1">Manage your courses and track performance</p>
            </div>
            <Link to={createPageUrl('CreateCourse')}>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Users, label: 'Total Students', value: stats.totalStudents.toLocaleString(), color: 'text-violet-600 bg-violet-100' },
            { icon: DollarSign, label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, color: 'text-emerald-600 bg-emerald-100' },
            { icon: Star, label: 'Average Rating', value: stats.averageRating.toFixed(1), color: 'text-amber-600 bg-amber-100' },
            { icon: BookOpen, label: 'Total Courses', value: stats.totalCourses, color: 'text-blue-600 bg-blue-100' }
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.color)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                Student Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner text="Loading courses..." />
            ) : courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                description="Create your first course to start teaching"
                action={
                  <Link to={createPageUrl('CreateCourse')}>
                    <Button className="bg-violet-600 hover:bg-violet-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center gap-4 py-4">
                    <SecureImage
                      src={course.thumbnail_url}
                      alt={sanitizePlainText(course.title)}
                      className="w-20 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {sanitizePlainText(course.title)}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.total_students || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400" />
                          {course.average_rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </div>
                    <Badge className={statusColors[course.status]}>
                      {course.status?.replace('_', ' ')}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(`CourseDetails?id=${course.id}`)} className="flex items-center">
                            <Eye className="w-4 h-4 mr-2" />
                            View Course
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(`EditCourse?id=${course.id}`)} className="flex items-center">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Course
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                    <SecureImage
                      src={review.user_avatar}
                      alt={sanitizePlainText(review.user_name)}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{sanitizePlainText(review.user_name)}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{sanitizePlainText(review.content)}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {format(new Date(review.created_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}