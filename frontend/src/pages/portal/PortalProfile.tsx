import React, { useState, useEffect } from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  // ... other icons
  RefreshCw,
  // ... other icons
} from 'lucide-react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  GraduationCap,
  Edit,
  Shield,
  Save,
  X,
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface UserProfile {
  user_id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_admin: boolean;
  phone_number: string | null;
  date_of_birth: string | null;
  is_verified: boolean;
  registration_date: string;
  guardian_name: string | null;
  guardian_phone: string | null;
  school: string | null;
  grade: string | null;
  avatar_url?: string;
}

interface AcademicStats {
  average_score: number;
  total_terms: number;
  best_subject: string;
  attendance_rate: number;
}

const profileFormSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone_number: z.string().optional(),
  guardian_name: z.string().min(2, 'Guardian name must be at least 2 characters'),
  guardian_phone: z.string().min(10, 'Valid phone number is required'),
  school: z.string().min(2, 'School name is required'),
  grade: z.string().min(1, 'Grade is required'),
});

const PortalProfile = () => {
  const { apiRequest } = useAuth();
  const { toast: uiToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [academicStats, setAcademicStats] = useState<AcademicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: '',
      phone_number: '',
      guardian_name: '',
      guardian_phone: '',
      school: '',
      grade: '',
    },
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (profile && form) {
      form.reset({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        guardian_name: profile.guardian_name || '',
        guardian_phone: profile.guardian_phone || '',
        school: profile.school || '',
        grade: profile.grade || '',
      });
    }
  }, [profile, form]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await apiRequest('/auth/validate/');
      
      if (profileError) {
        throw new Error(profileError);
      }
      
      if (profileData?.success) {
        setProfile(profileData.user);
        
        // Fetch additional profile details
        const { data: detailsData } = await apiRequest('/get_user_profile/');
        if (detailsData?.success) {
          setProfile(prev => ({
            ...prev!,
            ...detailsData.profile,
            full_name: detailsData.profile.full_name || profileData.user.full_name,
          }));
        }
      }
      
      // Fetch academic stats (optional)
      try {
        const { data: academicData } = await apiRequest('/academics/summary/');
        if (academicData?.success) {
          setAcademicStats({
            average_score: academicData.performance_stats?.overall_average || 0,
            total_terms: academicData.academic_history?.length || 0,
            best_subject: academicData.performance_stats?.best_subject?.subject || 'N/A',
            attendance_rate: academicData.current_summary?.attendance_percentage || 0,
          });
        }
      } catch (error) {
        console.log('No academic stats available');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      uiToast({
        title: 'Error',
        description: 'Failed to load profile information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      setSaving(true);
      
      const { data, error } = await apiRequest('/update_profile/', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        // Update local profile state
        setProfile(prev => ({
          ...prev!,
          full_name: values.full_name,
          phone_number: values.phone_number || null,
          guardian_name: values.guardian_name,
          guardian_phone: values.guardian_phone,
          school: values.school,
          grade: values.grade,
        }));
        
        setShowEditDialog(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    // Implement password change dialog or redirect
    toast.info('Password change functionality will be implemented soon');
  };

  const getAvatarInitials = (fullName: string) => {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateYearsInProgram = (registrationDate: string) => {
    const regDate = new Date(registrationDate);
    const now = new Date();
    const diffYears = now.getFullYear() - regDate.getFullYear();
    return diffYears > 0 ? `${diffYears} Year${diffYears > 1 ? 's' : ''}` : 'Less than a year';
  };

  const getSponsorshipStatus = () => {
    // This could be based on financial aid status or other criteria
    if (academicStats?.attendance_rate && academicStats.attendance_rate < 75) {
      return { status: 'Conditional', color: 'bg-amber-100 text-amber-700' };
    }
    return { status: 'Active', color: 'bg-emerald-100 text-emerald-700' };
  };

  if (loading) {
    return (
      <BeneficiaryLayout title="My Profile" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-slate-600">Loading profile information...</p>
          </div>
        </div>
      </BeneficiaryLayout>
    );
  }

  if (!profile) {
    return (
      <BeneficiaryLayout title="My Profile" subtitle="Profile not found">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Profile Not Found</h3>
            <p className="text-slate-500">Unable to load profile information</p>
            <Button 
              className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              onClick={fetchProfileData}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </BeneficiaryLayout>
    );
  }

  const sponsorshipStatus = getSponsorshipStatus();

  return (
    <BeneficiaryLayout title="My Profile" subtitle="View and manage your personal information">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-lg">
              <AvatarImage 
                src={profile.avatar_url || `api/placeholder/100/100?name=${encodeURIComponent(profile.full_name)}`} 
              />
              <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-700">
                {getAvatarInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2>
            <p className="text-slate-500">{profile.email}</p>
            <Badge className={`mt-3 ${sponsorshipStatus.color}`}>
              {sponsorshipStatus.status}
            </Badge>
            
            {profile.school && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-center gap-2 text-slate-600">
                  <GraduationCap className="w-5 h-5" />
                  <span className="font-medium">{profile.school}</span>
                </div>
                <p className="text-slate-500 mt-1">{profile.grade || 'Not specified'}</p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your personal information below.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+254 XXX XXX XXX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="guardian_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guardian Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Guardian's full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="guardian_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guardian Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Guardian's phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="school"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School</FormLabel>
                            <FormControl>
                              <Input placeholder="School name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="grade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade/Form</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Form 2, Grade 10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEditDialog(false)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleChangePassword}
              >
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{profile.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Phone className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900">
                      {profile.phone_number || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date of Birth</p>
                    <p className="font-medium text-slate-900">
                      {formatDate(profile.date_of_birth)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Member Since</p>
                    <p className="font-medium text-slate-900">
                      {formatDate(profile.registration_date)}
                    </p>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-500 mb-2">Username</p>
                  <code className="px-3 py-1 bg-slate-100 rounded text-sm font-mono">
                    {profile.username}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="font-medium text-slate-900">
                    {profile.guardian_name || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Relationship</p>
                  <p className="font-medium text-slate-900">
                    {profile.guardian_name ? 'Guardian' : 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium text-slate-900">
                    {profile.guardian_phone || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">
                    {profile.guardian_name ? 'Not specified' : 'No guardian info'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic & Sponsorship Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Academic Performance */}
            {academicStats && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    Academic Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600">Average Score</p>
                      <p className="text-lg font-bold text-blue-900">
                        {academicStats.average_score.toFixed(1)}%
                      </p>
                    </div>
                    
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs text-emerald-600">Terms Completed</p>
                      <p className="text-lg font-bold text-emerald-900">
                        {academicStats.total_terms}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-amber-600">Best Subject</p>
                      <p className="text-lg font-bold text-amber-900 truncate">
                        {academicStats.best_subject}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-600">Attendance</p>
                      <p className="text-lg font-bold text-purple-900">
                        {academicStats.attendance_rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sponsorship Details */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Sponsorship Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg ${sponsorshipStatus.color}`}>
                    <p className="text-xs">Status</p>
                    <p className="text-lg font-bold">{sponsorshipStatus.status}</p>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Joined Program</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatDate(profile.registration_date)}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Years in Program</p>
                    <p className="text-lg font-bold text-slate-900">
                      {calculateYearsInProgram(profile.registration_date)}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Account Status</p>
                    <p className="text-lg font-bold text-slate-900">
                      {profile.is_verified ? 'Verified' : 'Pending Verification'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </BeneficiaryLayout>
  );
};

export default PortalProfile;
