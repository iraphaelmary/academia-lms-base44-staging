import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X, Star } from 'lucide-react';
import CourseGrid from '../components/courses/CourseGrid';
import SearchBar from '../components/courses/SearchBar';
import CategoryFilter from '../components/courses/CategoryFilter';
import { sanitizePlainText } from '../components/security/SecurityUtils';
import { cn } from "@/lib/utils";

export default function CoursesPage() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(urlParams.get('category') || 'all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [minRating, setMinRating] = useState(0);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState(urlParams.get('sort') || 'popular');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch courses
  const { data: allCourses, isLoading } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'published' }, '-created_date', 100),
    initialData: []
  });

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...allCourses];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(course => 
        course.title?.toLowerCase().includes(query) ||
        course.short_description?.toLowerCase().includes(query) ||
        course.instructor_name?.toLowerCase().includes(query) ||
        course.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(course => course.category === selectedCategory);
    }

    // Level filter
    if (selectedLevel !== 'all') {
      result = result.filter(course => course.level === selectedLevel);
    }

    // Price filter
    if (showFreeOnly) {
      result = result.filter(course => course.is_free);
    } else {
      result = result.filter(course => 
        (course.price || 0) >= priceRange[0] && 
        (course.price || 0) <= priceRange[1]
      );
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter(course => (course.average_rating || 0) >= minRating);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (b.total_students || 0) - (a.total_students || 0));
        break;
      case 'highest-rated':
        result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case 'price-low':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
    }

    return result;
  }, [allCourses, searchQuery, selectedCategory, selectedLevel, priceRange, minRating, showFreeOnly, sortBy]);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedLevel('all');
    setPriceRange([0, 200]);
    setMinRating(0);
    setShowFreeOnly(false);
    setSortBy('popular');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedLevel !== 'all' || 
    minRating > 0 || showFreeOnly || priceRange[0] > 0 || priceRange[1] < 200;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Level */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Level</h4>
        <div className="space-y-2">
          {['all', 'beginner', 'intermediate', 'advanced', 'all_levels'].map(level => (
            <label key={level} className="flex items-center gap-3 cursor-pointer">
              <Checkbox 
                checked={selectedLevel === level}
                onCheckedChange={() => setSelectedLevel(level)}
              />
              <span className="text-sm text-slate-600 capitalize">
                {level === 'all' ? 'All Levels' : level.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Price Range</h4>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={200}
            step={10}
            className="mb-3"
          />
          <div className="flex justify-between text-sm text-slate-500">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}+</span>
          </div>
        </div>
        <label className="flex items-center gap-3 mt-4 cursor-pointer">
          <Checkbox 
            checked={showFreeOnly}
            onCheckedChange={setShowFreeOnly}
          />
          <span className="text-sm text-slate-600">Free courses only</span>
        </label>
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Rating</h4>
        <div className="space-y-2">
          {[4.5, 4.0, 3.5, 3.0].map(rating => (
            <label key={rating} className="flex items-center gap-3 cursor-pointer">
              <Checkbox 
                checked={minRating === rating}
                onCheckedChange={() => setMinRating(minRating === rating ? 0 : rating)}
              />
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm text-slate-600">{rating} & up</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={clearFilters}
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Explore Courses</h1>
          
          <div className="flex flex-col lg:flex-row gap-4">
            <SearchBar 
              value={searchQuery}
              onSearch={setSearchQuery}
              placeholder="Search for courses..."
              className="flex-1"
            />
            
            <div className="flex gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="highest-rated">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filter Button */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-2 w-2 h-2 bg-violet-500 rounded-full" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="mt-6">
            <CategoryFilter 
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-6">Filters</h3>
              <FilterContent />
            </div>
          </aside>

          {/* Course Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600">
                <span className="font-semibold text-slate-900">{filteredCourses.length}</span> courses found
              </p>
            </div>
            
            <CourseGrid 
              courses={filteredCourses}
              isLoading={isLoading}
              emptyTitle="No courses found"
              emptyDescription="Try adjusting your filters or search terms"
              emptyAction={
                hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}