import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, BookOpen, DollarSign, TrendingUp, Shield, AlertTriangle,
  Search, Eye, Ban, CheckCircle, XCircle, Clock, Activity
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import SecureImage from '../components/ui/SecureImage';
import { sanitizePlainText, maskEmail } from '../components/security/SecurityUtils';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    base44.auth.me().then(userData => {
      if (userData.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(userData);
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  // Fetch all users
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
    enabled: user?.role === 'admin'
  });

  // Fetch all courses
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => base44.entities.Course.list('-created_date', 100),
    enabled: user?.role === 'admin'
  });

  // Fetch all enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: () => base44.entities.Enrollment.list('-enrolled_at', 500),
    enabled: user?.role === 'admin'
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-timestamp', 100),
    enabled: user?.role === 'admin'
  });

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.status === 'published').length,
    totalEnrollments: enrollments.length,
    totalRevenue: enrollments.reduce((acc, e) => acc + (e.payment_amount || 0), 0),
    activeUsers: users.filter(u => u.last_login_at && new Date(u.last_login_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
  };

  // Course status distribution
  const courseStatusData = [
    { name: 'Published', value: courses.filter(c => c.status === 'published').length, color: '#10b981' },
    { name: 'Draft', value: courses.filter(c => c.status === 'draft').length, color: '#64748b' },
    { name: 'Pending', value: courses.filter(c => c.status === 'pending_review').length, color: '#f59e0b' },
    { name: 'Archived', value: courses.filter(c => c.status === 'archived').length, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Mock growth data
  const growthData = [
    { month: 'Jan', users: 120, enrollments: 450 },
    { month: 'Feb', users: 150, enrollments: 520 },
    { month: 'Mar', users: 180, enrollments: 680 },
    { month: 'Apr', users: 220, enrollments: 750 },
    { month: 'May', users: 280, enrollments: 890 },
    { month: 'Jun', users: 350, enrollments: 1050 }
  ];

  // Filter users
  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Security events
  const securityEvents = auditLogs.filter(log => 
    ['failed_login', 'suspicious_activity', 'permission_change'].includes(log.action)
  );

  const severityColors = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-amber-100 text-amber-700',
    critical: 'bg-rose-100 text-rose-700'
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verifying access..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-500">System overview and management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'bg-violet-100 text-violet-600' },
            { icon: BookOpen, label: 'Total Courses', value: stats.totalCourses, color: 'bg-blue-100 text-blue-600' },
            { icon: TrendingUp, label: 'Enrollments', value: stats.totalEnrollments, color: 'bg-emerald-100 text-emerald-600' },
            { icon: DollarSign, label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, color: 'bg-amber-100 text-amber-600' }
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="security">Security Logs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} name="Users" />
                      <Line type="monotone" dataKey="enrollments" stroke="#10b981" strokeWidth={2} name="Enrollments" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Course Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={courseStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {courseStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <LoadingSpinner text="Loading users..." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.slice(0, 20).map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <SecureImage
                                src={u.avatar_url}
                                alt={sanitizePlainText(u.full_name)}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <span className="font-medium">{sanitizePlainText(u.full_name)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500">{maskEmail(u.email)}</TableCell>
                          <TableCell>
                            <Badge className={u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-700'}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{u.enrolled_courses_count || 0}</TableCell>
                          <TableCell className="text-slate-500">
                            {u.created_date && format(new Date(u.created_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Course Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCourses ? (
                  <LoadingSpinner text="Loading courses..." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.slice(0, 20).map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <SecureImage
                                src={course.thumbnail_url}
                                alt={sanitizePlainText(course.title)}
                                className="w-16 h-10 rounded object-cover"
                              />
                              <span className="font-medium truncate max-w-xs">{sanitizePlainText(course.title)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500">{sanitizePlainText(course.instructor_name)}</TableCell>
                          <TableCell>
                            <Badge className={
                              course.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                              course.status === 'pending_review' ? 'bg-amber-100 text-amber-700' :
                              course.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                              'bg-rose-100 text-rose-700'
                            }>
                              {course.status?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{course.total_students || 0}</TableCell>
                          <TableCell>{course.average_rating?.toFixed(1) || '-'}</TableCell>
                          <TableCell className="text-slate-500">
                            {course.created_date && format(new Date(course.created_date), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <CardTitle>Security & Audit Logs</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No activity yet"
                    description="Audit logs will appear here"
                  />
                ) : (
                  <div className="space-y-3">
                    {auditLogs.slice(0, 30).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <Badge className={severityColors[log.severity]}>
                            {log.severity}
                          </Badge>
                          <div>
                            <p className="font-medium text-slate-900">{log.action?.replace('_', ' ')}</p>
                            <p className="text-sm text-slate-500">
                              {log.user_email ? maskEmail(log.user_email) : 'System'} • {log.resource_type}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-slate-400">
                          {log.timestamp && format(new Date(log.timestamp), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}