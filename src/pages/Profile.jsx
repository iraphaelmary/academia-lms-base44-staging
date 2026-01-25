import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, Mail, Globe, Linkedin, Twitter, Camera, Shield, 
  Bell, Lock, LogOut, Trash2, AlertTriangle, CheckCircle
} from 'lucide-react';
import SecureImage from '../components/ui/SecureImage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  sanitizePlainText, 
  validateUrl, 
  validateLength,
  createAuditEntry 
} from '../components/security/SecurityUtils';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    headline: '',
    website: '',
    linkedin_url: '',
    twitter_url: '',
    preferences: {
      email_notifications: true,
      marketing_emails: false,
      course_updates: true,
      dark_mode: false
    }
  });
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setFormData({
        full_name: userData.full_name || '',
        bio: userData.bio || '',
        headline: userData.headline || '',
        website: userData.website || '',
        linkedin_url: userData.linkedin_url || '',
        twitter_url: userData.twitter_url || '',
        preferences: userData.preferences || {
          email_notifications: true,
          marketing_emails: false,
          course_updates: true,
          dark_mode: false
        }
      });
      setLoading(false);
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  // Input validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!validateLength(formData.full_name, 2, 100)) {
      newErrors.full_name = 'Name must be between 2 and 100 characters';
    }
    
    if (formData.bio && !validateLength(formData.bio, 0, 1000)) {
      newErrors.bio = 'Bio must be less than 1000 characters';
    }
    
    if (formData.headline && !validateLength(formData.headline, 0, 200)) {
      newErrors.headline = 'Headline must be less than 200 characters';
    }
    
    if (formData.website && !validateUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }
    
    if (formData.linkedin_url && !formData.linkedin_url.includes('linkedin.com')) {
      newErrors.linkedin_url = 'Please enter a valid LinkedIn URL';
    }
    
    if (formData.twitter_url && !formData.twitter_url.includes('twitter.com') && !formData.twitter_url.includes('x.com')) {
      newErrors.twitter_url = 'Please enter a valid Twitter/X URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (!validateForm()) {
        throw new Error('Please fix the form errors');
      }
      
      // Sanitize all text inputs
      const sanitizedData = {
        bio: sanitizePlainText(data.bio),
        headline: sanitizePlainText(data.headline),
        website: data.website,
        linkedin_url: data.linkedin_url,
        twitter_url: data.twitter_url,
        preferences: data.preferences
      };
      
      await base44.auth.updateMe(sanitizedData);
      
      // Audit log
      await base44.entities.AuditLog.create(
        createAuditEntry('update_profile', 'user', user.id, { fields_updated: Object.keys(sanitizedData) })
      );
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries(['user']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handlePreferenceChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      setUser(prev => ({ ...prev, avatar_url: file_url }));
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Account Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile details visible to others</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <SecureImage
                      src={user?.avatar_url}
                      alt={user?.full_name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-violet-700 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{user?.full_name}</h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Your full name"
                        maxLength={100}
                        disabled
                        className="bg-slate-50"
                      />
                      <p className="text-xs text-slate-500">Name cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headline">Professional Headline</Label>
                    <Input
                      id="headline"
                      value={formData.headline}
                      onChange={(e) => handleInputChange('headline', e.target.value)}
                      placeholder="e.g. Senior Developer at Company"
                      maxLength={200}
                      className={errors.headline ? 'border-rose-500' : ''}
                    />
                    {errors.headline && <p className="text-sm text-rose-500">{errors.headline}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={1000}
                      className={errors.bio ? 'border-rose-500' : ''}
                    />
                    <div className="flex justify-between">
                      {errors.bio && <p className="text-sm text-rose-500">{errors.bio}</p>}
                      <p className="text-xs text-slate-400 ml-auto">{formData.bio.length}/1000</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className={cn("pl-10", errors.website && 'border-rose-500')}
                      />
                    </div>
                    {errors.website && <p className="text-sm text-rose-500">{errors.website}</p>}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="linkedin"
                          value={formData.linkedin_url}
                          onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                          placeholder="LinkedIn profile URL"
                          className={cn("pl-10", errors.linkedin_url && 'border-rose-500')}
                        />
                      </div>
                      {errors.linkedin_url && <p className="text-sm text-rose-500">{errors.linkedin_url}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter/X</Label>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="twitter"
                          value={formData.twitter_url}
                          onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                          placeholder="Twitter/X profile URL"
                          className={cn("pl-10", errors.twitter_url && 'border-rose-500')}
                        />
                      </div>
                      {errors.twitter_url && <p className="text-sm text-rose-500">{errors.twitter_url}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => updateProfileMutation.mutate(formData)}
                    disabled={updateProfileMutation.isPending}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'email_notifications', label: 'Email Notifications', description: 'Receive important updates via email' },
                  { key: 'course_updates', label: 'Course Updates', description: 'Get notified about updates to enrolled courses' },
                  { key: 'marketing_emails', label: 'Marketing Emails', description: 'Receive promotional offers and news' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                    <div>
                      <h4 className="font-medium text-slate-900">{item.label}</h4>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                    <Switch
                      checked={formData.preferences[item.key]}
                      onCheckedChange={(checked) => handlePreferenceChange(item.key, checked)}
                    />
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => updateProfileMutation.mutate(formData)}
                    disabled={updateProfileMutation.isPending}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-emerald-50 border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-700">
                      Your account is secured with email authentication
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">Email</h4>
                          <p className="text-sm text-slate-500">{user?.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-200">
                <CardHeader>
                  <CardTitle className="text-rose-600">Danger Zone</CardTitle>
                  <CardDescription>Irreversible account actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">Sign Out</h4>
                        <p className="text-sm text-slate-500">Sign out from your account</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}