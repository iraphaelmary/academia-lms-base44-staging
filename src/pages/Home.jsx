import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Play, Star, Users, Award, Clock, ArrowRight, 
  TrendingUp, BookOpen, CheckCircle, Sparkles, ChevronRight
} from 'lucide-react';
import CourseCard from '../components/courses/CourseCard';
import CategoryFilter from '../components/courses/CategoryFilter';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SecureImage from '../components/ui/SecureImage';
import { sanitizePlainText } from '../components/security/SecurityUtils';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch featured courses
  const { data: featuredCourses, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'published', is_featured: true }, '-total_students', 8),
    initialData: []
  });

  // Fetch trending courses
  const { data: trendingCourses, isLoading: loadingTrending } = useQuery({
    queryKey: ['trending-courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'published' }, '-total_students', 8),
    initialData: []
  });

  // Fetch categories stats
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.filter({ is_active: true }, 'order', 10),
    initialData: []
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl(`Courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const stats = [
    { icon: BookOpen, value: '10,000+', label: 'Courses' },
    { icon: Users, value: '50M+', label: 'Students' },
    { icon: Award, value: '200+', label: 'Instructors' },
    { icon: Star, value: '4.8', label: 'Average Rating' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-indigo-600/5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="bg-violet-100 text-violet-700 mb-6 px-4 py-1.5">
              <Sparkles className="w-4 h-4 mr-2" />
              Learn Without Limits
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6">
              Unlock Your Potential with{' '}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                World-Class Learning
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join millions of learners worldwide. Access thousands of courses taught by industry experts 
              and transform your career today.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to learn today?"
                  className="pl-14 pr-36 py-7 text-lg rounded-2xl border-slate-200 shadow-lg shadow-slate-200/50 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  maxLength={100}
                />
                <Button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-700 px-6 py-5 rounded-xl"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex flex-col items-center p-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                    <stat.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Explore Categories</h2>
            <p className="text-slate-600">Find the perfect course in your area of interest</p>
          </div>
          <CategoryFilter 
            selectedCategory={selectedCategory} 
            onSelect={setSelectedCategory}
            className="justify-center"
          />
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Courses</h2>
              <p className="text-slate-600">Hand-picked courses by our team</p>
            </div>
            <Link 
              to={createPageUrl('Courses?featured=true')}
              className="hidden md:flex items-center gap-2 text-violet-600 font-medium hover:text-violet-700 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingFeatured ? (
            <LoadingSpinner size="lg" text="Loading courses..." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.slice(0, 4).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          <Link 
            to={createPageUrl('Courses?featured=true')}
            className="flex md:hidden items-center justify-center gap-2 mt-8 text-violet-600 font-medium"
          >
            View All Featured <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Trending Courses */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                <h2 className="text-3xl font-bold text-slate-900">Trending Now</h2>
              </div>
              <p className="text-slate-600">Most popular courses this week</p>
            </div>
            <Link 
              to={createPageUrl('Courses?sort=popular')}
              className="hidden md:flex items-center gap-2 text-violet-600 font-medium hover:text-violet-700 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingTrending ? (
            <LoadingSpinner size="lg" text="Loading courses..." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingCourses.slice(0, 4).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Learn With Us?</h2>
            <p className="text-violet-200 max-w-2xl mx-auto">
              We're committed to providing the best learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: 'Expert Instructors',
                description: 'Learn from industry professionals with real-world experience'
              },
              {
                icon: Clock,
                title: 'Lifetime Access',
                description: 'Access your courses anytime, anywhere, on any device'
              },
              {
                icon: Award,
                title: 'Certificates',
                description: 'Earn recognized certificates to boost your career'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-sm"
              >
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-5">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-violet-200">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Join millions of learners and start building the skills you need to succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('Courses')}>
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 px-8 py-6 text-base">
                Browse All Courses
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl('BecomeInstructor')}>
              <Button size="lg" variant="outline" className="px-8 py-6 text-base border-2">
                Become an Instructor
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}