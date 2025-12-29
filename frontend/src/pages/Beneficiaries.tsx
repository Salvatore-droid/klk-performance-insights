import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  RefreshCw,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  Eye,
  ExternalLink,
  X,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Camera,
  User,
  MapPin,
  School,
  BookOpen,
  Shield,
  PhoneCall,
  Calendar,
  Hash,
  Grid3X3,
  Edit,
  Save,
  Trash2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Beneficiary {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  school: string | null;
  grade: string | null;
  education_level: {
    id: number | null;
    title: string | null;
    key: string | null;
  } | null;
  grade_class: {
    id: number | null;
    name: string | null;
  } | null;
  county: string | null;
  sponsorship_status: string;
  is_verified: boolean;
  registration_date: string;
  years_in_program: number;
  academic_performance: number | null;
  academic_rank: number | null;
  total_fees: string;
  total_paid: string;
  balance: string;
  profile_image_url: string | null;
  date_of_birth?: string;
  gender?: string;
  national_id?: string;
  address?: string;
  constituency?: string;
  admission_number?: string;
  school_type?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface BeneficiaryStats {
  total: number;
  active: number;
  pending_verification: number;
}

interface EducationLevel {
  id: number;
  title: string;
  key: string;
}

interface GradeClass {
  id: number;
  name: string;
  education_level: number;
}

const Beneficiaries = () => {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [stats, setStats] = useState<BeneficiaryStats>({ total: 0, active: 0, pending_verification: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const [creatingBeneficiary, setCreatingBeneficiary] = useState(false);
  const [updatingBeneficiary, setUpdatingBeneficiary] = useState(false);
  
  // Form state for creating
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    national_id: '',
    county: '',
    school: '',
    grade: '',
    guardian_name: '',
    guardian_phone: '',
    sponsorship_status: 'active',
  });
  
  // Form state for updating
  const [updateFormData, setUpdateFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    national_id: '',
    county: '',
    school: '',
    grade: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    sponsorship_status: 'active',
    is_verified: true,
    education_level_id: '',
    grade_class_id: '',
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [updateProfileImage, setUpdateProfileImage] = useState<File | null>(null);
  const [updatePreviewImage, setUpdatePreviewImage] = useState<string | null>(null);

  // Education data
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [gradeClasses, setGradeClasses] = useState<GradeClass[]>([]);

  const fetchBeneficiaries = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(countyFilter !== 'all' && { county: countyFilter }),
      });

      const { data, error } = await apiRequest(`/admin/beneficiaries/?${params}`);
      
      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        setBeneficiaries(data.beneficiaries || []);
        setTotalCount(data.pagination?.total_count || 0);
      }
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load beneficiaries data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, countyFilter, apiRequest, toast]);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoadingStats(true);
      
      const { data, error } = await apiRequest('/admin/beneficiaries/?limit=1');
      
      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        setStats(data.summary || { total: 0, active: 0, pending_verification: 0 });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [apiRequest]);

  const fetchEducationData = useCallback(async () => {
    try {
      const { data, error } = await apiRequest('/admin/education/levels/');
      if (data?.success) {
        setEducationLevels(data.education_levels || []);
      }
      
      // Fetch grade classes for the first level by default
      if (data?.education_levels?.length > 0) {
        const levelId = data.education_levels[0].id;
        const gradeResponse = await apiRequest(`/admin/education/levels/${levelId}/grades/`);
        if (gradeResponse.data?.success) {
          setGradeClasses(gradeResponse.data.grades || []);
        }
      }
    } catch (error) {
      console.error('Error fetching education data:', error);
    }
  }, [apiRequest]);

  useEffect(() => {
    fetchBeneficiaries();
    fetchStatistics();
    fetchEducationData();
  }, [fetchBeneficiaries, fetchStatistics, fetchEducationData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchBeneficiaries();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchBeneficiaries, currentPage]);

  // Handle form input changes for create
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle form input changes for update
  const handleUpdateInputChange = (field: string, value: string) => {
    setUpdateFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle file upload for create
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Profile image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a JPG, PNG, GIF, or WebP image',
          variant: 'destructive',
        });
        return;
      }
      
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file upload for update
  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Profile image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a JPG, PNG, GIF, or WebP image',
          variant: 'destructive',
        });
        return;
      }
      
      setUpdateProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setUpdatePreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle create form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreatingBeneficiary(true);
      
      // Basic validation
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone_number || !formData.school) {
        toast({
          title: 'Missing information',
          description: 'Please fill in all required fields (First Name, Last Name, Email, Phone Number, School)',
          variant: 'destructive',
        });
        setCreatingBeneficiary(false);
        return;
      }
      
      // Create FormData object
      const submitFormData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitFormData.append(key, value);
        }
      });
      
      // Add profile image if exists
      if (profileImage) {
        submitFormData.append('profile_image', profileImage);
      }
      
      // Send FormData
      const { data, error } = await apiRequest('/admin/beneficiaries/create/', {
        method: 'POST',
        body: submitFormData,
      });
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Beneficiary created successfully',
        });
        
        // Reset form and close dialog
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          date_of_birth: '',
          gender: '',
          national_id: '',
          county: '',
          school: '',
          grade: '',
          guardian_name: '',
          guardian_phone: '',
          sponsorship_status: 'active',
        });
        setProfileImage(null);
        setPreviewImage(null);
        setCreateDialogOpen(false);
        
        // Refresh data
        await fetchBeneficiaries();
        await fetchStatistics();
      } else {
        throw new Error(data?.error || 'Failed to create beneficiary');
      }
    } catch (error: any) {
      console.error('Error creating beneficiary:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create beneficiary',
        variant: 'destructive',
      });
    } finally {
      setCreatingBeneficiary(false);
    }
  };

  // Handle update form submission
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBeneficiary) return;
    
    try {
      setUpdatingBeneficiary(true);
      
      // Create FormData object
      const submitFormData = new FormData();
      
      // Add all form fields
      Object.entries(updateFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          submitFormData.append(key, value);
        }
      });
      
      // Add profile image if exists
      if (updateProfileImage) {
        submitFormData.append('profile_image', updateProfileImage);
      }
      
      // Send FormData
      const { data, error } = await apiRequest(`/admin/beneficiaries/${editingBeneficiary.id}/update/`, {
        method: 'POST',
        body: submitFormData,
      });
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Beneficiary updated successfully',
        });
        
        // Reset form and close dialog
        setUpdateFormData({
          first_name: '',
          last_name: '',
          phone_number: '',
          date_of_birth: '',
          gender: '',
          national_id: '',
          county: '',
          school: '',
          grade: '',
          guardian_name: '',
          guardian_phone: '',
          guardian_email: '',
          guardian_relationship: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          sponsorship_status: 'active',
          is_verified: true,
          education_level_id: '',
          grade_class_id: '',
        });
        setUpdateProfileImage(null);
        setUpdatePreviewImage(null);
        setUpdateDialogOpen(false);
        setEditingBeneficiary(null);
        
        // Refresh data
        await fetchBeneficiaries();
        await fetchStatistics();
      } else {
        throw new Error(data?.error || 'Failed to update beneficiary');
      }
    } catch (error: any) {
      console.error('Error updating beneficiary:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update beneficiary',
        variant: 'destructive',
      });
    } finally {
      setUpdatingBeneficiary(false);
    }
  };

  // Open update dialog with beneficiary data
  const handleOpenUpdateDialog = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    
    // Parse full name to first and last name
    const nameParts = beneficiary.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Set update form data
    setUpdateFormData({
      first_name: firstName,
      last_name: lastName,
      phone_number: beneficiary.phone_number || '',
      date_of_birth: beneficiary.date_of_birth || '',
      gender: beneficiary.gender || '',
      national_id: beneficiary.national_id || '',
      county: beneficiary.county || '',
      school: beneficiary.school || '',
      grade: beneficiary.grade || '',
      guardian_name: beneficiary.guardian_name || '',
      guardian_phone: beneficiary.guardian_phone || '',
      guardian_email: beneficiary.guardian_email || '',
      guardian_relationship: beneficiary.guardian_relationship || '',
      emergency_contact_name: beneficiary.emergency_contact_name || '',
      emergency_contact_phone: beneficiary.emergency_contact_phone || '',
      sponsorship_status: beneficiary.sponsorship_status || 'active',
      is_verified: beneficiary.is_verified || true,
      education_level_id: beneficiary.education_level?.id?.toString() || '',
      grade_class_id: beneficiary.grade_class?.id?.toString() || '',
    });
    
    // Set preview image if exists
    if (beneficiary.profile_image_url) {
      setUpdatePreviewImage(beneficiary.profile_image_url);
    }
    
    setUpdateDialogOpen(true);
  };

  // Handle education level change for update form
  const handleEducationLevelChange = async (levelId: string) => {
    handleUpdateInputChange('education_level_id', levelId);
    handleUpdateInputChange('grade_class_id', '');
    
    if (levelId) {
      try {
        const { data, error } = await apiRequest(`/admin/education/levels/${levelId}/grades/`);
        if (data?.success) {
          setGradeClasses(data.grades || []);
        }
      } catch (error) {
        console.error('Error fetching grade classes:', error);
      }
    } else {
      setGradeClasses([]);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedBeneficiary || !messageContent) {
      toast({
        title: 'Error',
        description: 'Please enter a message.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSendingMessage(true);
      
      const { data, error } = await apiRequest('/admin/messages/send/', {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: selectedBeneficiary.id,
          subject: `Message from Administrator`,
          content: messageContent
        })
      });

      if (error) throw new Error(error);

      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Message sent successfully.',
        });
        setMessageDialogOpen(false);
        setMessageContent('');
        setSelectedBeneficiary(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (beneficiaryId: number, newStatus: string) => {
    try {
      const { data, error } = await apiRequest(`/admin/beneficiaries/${beneficiaryId}/update/`, {
        method: 'POST',
        body: JSON.stringify({
          sponsorship_status: newStatus
        })
      });

      if (error) throw new Error(error);

      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Status updated successfully.',
        });
        
        setBeneficiaries(prev => 
          prev.map(beneficiary => 
            beneficiary.id === beneficiaryId 
              ? { ...beneficiary, sponsorship_status: newStatus }
              : beneficiary
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (beneficiaryId: number) => {
    navigate(`/beneficiaries/${beneficiaryId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-300"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPerformanceBadge = (score: number | null) => {
    if (!score) return <Badge variant="outline">N/A</Badge>;
    
    if (score >= 90) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300">{score}%</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300">{score}%</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300">{score}%</Badge>;
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-300">{score}%</Badge>;
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const counties = Array.from(new Set(beneficiaries.map(b => b.county).filter(Boolean))) as string[];

  const statCards = [
    { 
      title: 'Total Beneficiaries', 
      value: stats.total.toLocaleString(), 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      loading: loadingStats
    },
    { 
      title: 'Active Students', 
      value: stats.active.toLocaleString(), 
      icon: UserCheck, 
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100',
      loading: loadingStats
    },
    { 
      title: 'Pending Verification', 
      value: stats.pending_verification.toLocaleString(), 
      icon: UserX, 
      color: 'from-orange-500 to-amber-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-100',
      loading: loadingStats
    },
    { 
      title: 'Years Average', 
      value: beneficiaries.length > 0 
        ? (beneficiaries.reduce((sum, b) => sum + b.years_in_program, 0) / beneficiaries.length).toFixed(1)
        : '0.0', 
      icon: GraduationCap, 
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-100',
      loading: loading
    },
  ];

  // Kenya counties for dropdown
  const kenyaCounties = [
    'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta', 'Garissa', 'Wajir', 'Mandera',
    'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
    'Nyeri', 'Kirinyaga', 'Muranga', 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
    'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado',
    'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay',
    'Migori', 'Kisii', 'Nyamira', 'Nairobi'
  ];

  return (
    <DashboardLayout 
      title="Beneficiaries Management" 
      subtitle="Comprehensive management and tracking of all program beneficiaries"
    >
      {/* Stats Cards with improved design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-2">{stat.title}</p>
                  {stat.loading ? (
                    <div className="h-10 flex items-center">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                  )}
                </div>
                <div className={`w-14 h-14 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-inner`}>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></div>
                All Beneficiaries
                <Badge variant="outline" className="ml-4 border-blue-200 text-blue-700">
                  {totalCount} Total
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2 text-slate-600">
                Comprehensive list of all registered beneficiaries with filtering and search capabilities
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search by name, email, school..." 
                  className="pl-10 bg-slate-50 border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-white border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              
              {counties.length > 0 && (
                <Select value={countyFilter} onValueChange={setCountyFilter}>
                  <SelectTrigger className="w-[140px] bg-white border-slate-200">
                    <SelectValue placeholder="County" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Counties</SelectItem>
                    {counties.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => { 
                  setSearchQuery(''); 
                  setStatusFilter('all'); 
                  setCountyFilter('all'); 
                }}
                className="border-slate-200 hover:bg-slate-50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchBeneficiaries()}
                className="border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transition-all"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Beneficiary
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
              <p className="text-slate-600">Loading beneficiaries data...</p>
            </div>
          ) : beneficiaries.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Beneficiaries Found</h3>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                {searchQuery || statusFilter !== 'all' || countyFilter !== 'all'
                  ? 'No beneficiaries match your current search filters. Try adjusting your criteria.' 
                  : 'There are no beneficiaries registered in the system yet.'}
              </p>
              {!searchQuery && statusFilter === 'all' && countyFilter === 'all' && (
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Beneficiary
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <TableRow className="border-b-slate-200">
                      <TableHead className="font-semibold text-slate-700">Beneficiary</TableHead>
                      <TableHead className="font-semibold text-slate-700">School & Grade</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Performance</TableHead>
                      <TableHead className="font-semibold text-slate-700">Financial</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiaries.map((beneficiary) => (
                      <TableRow key={beneficiary.id} className="border-b-slate-100 hover:bg-blue-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                              <AvatarImage src={beneficiary.profile_image_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                                {beneficiary.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 truncate">{beneficiary.full_name}</p>
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center text-xs text-slate-500">
                                  <Mail className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                  <span className="truncate">{beneficiary.email}</span>
                                </div>
                                {beneficiary.phone_number && (
                                  <div className="flex items-center text-xs text-slate-500">
                                    <Phone className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                    <span>{beneficiary.phone_number}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <School className="w-3.5 h-3.5 text-slate-400" />
                              <p className="font-medium text-slate-900">{beneficiary.school || 'Not specified'}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                              <p className="text-sm text-slate-600">Grade {beneficiary.grade || 'N/A'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            {getStatusBadge(beneficiary.sponsorship_status)}
                            {beneficiary.is_verified && (
                              <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPerformanceBadge(beneficiary.academic_performance)}
                          {beneficiary.academic_rank && (
                            <p className="text-xs text-slate-500 mt-1">
                              Rank #{beneficiary.academic_rank}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className={`font-semibold ${
                              parseFloat(beneficiary.balance) > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatCurrency(beneficiary.balance)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Paid: {formatCurrency(beneficiary.total_paid)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                onClick={() => handleOpenUpdateDialog(beneficiary)}
                                className="cursor-pointer"
                              >
                                <Edit className="w-4 h-4 mr-2 text-blue-600" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewDetails(beneficiary.id)} className="cursor-pointer">
                                <Eye className="w-4 h-4 mr-2 text-slate-500" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedBeneficiary(beneficiary);
                                  setMessageDialogOpen(true);
                                }}
                                className="cursor-pointer"
                              >
                                <Mail className="w-4 h-4 mr-2 text-slate-500" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => window.open(`/portal/dashboard?user=${beneficiary.id}`, '_blank')} className="cursor-pointer">
                                <ExternalLink className="w-4 h-4 mr-2 text-slate-500" />
                                View Portal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Change Status
                              </div>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(beneficiary.id, 'active')} className="cursor-pointer">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Active
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(beneficiary.id, 'pending')} className="cursor-pointer">
                                <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                                Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(beneficiary.id, 'suspended')} className="cursor-pointer">
                                <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                Suspend
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-semibold text-slate-900">{totalCount}</span> beneficiaries
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                      <SelectTrigger className="w-[100px] bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="25">25 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 border-slate-200"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-gradient-to-r from-blue-600 to-blue-500' : 'border-slate-200'}`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 border-slate-200"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Beneficiary Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center">
                <UserPlus className="w-6 h-6 mr-3" />
                Create New Beneficiary
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                Add a new beneficiary to the sponsorship program
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <User className="w-4 h-4 mr-2" />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <School className="w-4 h-4 mr-2" />
                  Education
                </TabsTrigger>
                <TabsTrigger value="guardian" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Guardian Info
                </TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit}>
                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile Photo Section */}
                    <div className="md:col-span-1">
                      <Card className="border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="text-center">
                              <Label className="text-sm font-medium text-slate-700 mb-4 block">Profile Photo</Label>
                              <div className="relative">
                                {previewImage ? (
                                  <div className="relative mx-auto">
                                    <img 
                                      src={previewImage} 
                                      alt="Preview" 
                                      className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewImage(null);
                                        setProfileImage(null);
                                      }}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border-4 border-white shadow-lg flex items-center justify-center mx-auto">
                                    <Camera className="w-16 h-16 text-blue-300" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-6 space-y-3">
                                <Label 
                                  htmlFor="file-upload" 
                                  className="cursor-pointer inline-flex items-center justify-center w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Photo
                                </Label>
                                <Input
                                  id="file-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleFileChange}
                                />
                                <p className="text-xs text-slate-500 text-center">
                                  JPG, PNG, GIF or WebP • Max 5MB
                                </p>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor="date_of_birth" className="text-sm font-medium flex items-center">
                                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                  Date of Birth
                                </Label>
                                <Input
                                  id="date_of_birth"
                                  type="date"
                                  value={formData.date_of_birth}
                                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                  className="border-slate-200 focus:border-blue-500"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="gender" className="text-sm font-medium flex items-center">
                                  <User className="w-4 h-4 mr-2 text-slate-400" />
                                  Gender
                                </Label>
                                <Select 
                                  value={formData.gender} 
                                  onValueChange={(value) => handleInputChange('gender', value)}
                                >
                                  <SelectTrigger className="border-slate-200 focus:border-blue-500">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Personal Information Fields */}
                    <div className="md:col-span-2">
                      <Card>
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold flex items-center">
                            <User className="w-5 h-5 mr-2 text-blue-600" />
                            Personal Information
                          </CardTitle>
                          <CardDescription>
                            Enter the beneficiary's personal details
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="first_name" className="text-sm font-medium">
                                First Name *
                              </Label>
                              <Input
                                id="first_name"
                                placeholder="Enter first name"
                                value={formData.first_name}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                className="border-slate-200 focus:border-blue-500"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="last_name" className="text-sm font-medium">
                                Last Name *
                              </Label>
                              <Input
                                id="last_name"
                                placeholder="Enter last name"
                                value={formData.last_name}
                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                className="border-slate-200 focus:border-blue-500"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-slate-400" />
                              Email Address *
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="example@domain.com"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="border-slate-200 focus:border-blue-500"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone_number" className="text-sm font-medium flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-slate-400" />
                              Phone Number *
                            </Label>
                            <Input
                              id="phone_number"
                              placeholder="0712 345 678"
                              value={formData.phone_number}
                              onChange={(e) => handleInputChange('phone_number', e.target.value)}
                              className="border-slate-200 focus:border-blue-500"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="national_id" className="text-sm font-medium flex items-center">
                              <Hash className="w-4 h-4 mr-2 text-slate-400" />
                              National ID Number
                            </Label>
                            <Input
                              id="national_id"
                              placeholder="12345678"
                              value={formData.national_id}
                              onChange={(e) => handleInputChange('national_id', e.target.value)}
                              className="border-slate-200 focus:border-blue-500"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="county" className="text-sm font-medium flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                              County
                            </Label>
                            <Select 
                              value={formData.county} 
                              onValueChange={(value) => handleInputChange('county', value)}
                            >
                              <SelectTrigger className="border-slate-200 focus:border-blue-500">
                                <SelectValue placeholder="Select county" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {kenyaCounties.map(county => (
                                  <SelectItem key={county} value={county}>{county}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Education Information Tab */}
                <TabsContent value="education" className="space-y-6 py-6">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <School className="w-5 h-5 mr-2 text-blue-600" />
                        Education Information
                      </CardTitle>
                      <CardDescription>
                        Enter the beneficiary's school and academic details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="school" className="text-sm font-medium flex items-center">
                          <School className="w-4 h-4 mr-2 text-slate-400" />
                          School Name *
                        </Label>
                        <Input
                          id="school"
                          placeholder="Enter school name"
                          value={formData.school}
                          onChange={(e) => handleInputChange('school', e.target.value)}
                          className="border-slate-200 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="grade" className="text-sm font-medium flex items-center">
                            <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                            Grade/Class
                          </Label>
                          <Input
                            id="grade"
                            placeholder="Form 3, Grade 7, etc."
                            value={formData.grade}
                            onChange={(e) => handleInputChange('grade', e.target.value)}
                            className="border-slate-200 focus:border-blue-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="sponsorship_status" className="text-sm font-medium flex items-center">
                            <Grid3X3 className="w-4 h-4 mr-2 text-slate-400" />
                            Sponsorship Status *
                          </Label>
                          <Select 
                            value={formData.sponsorship_status} 
                            onValueChange={(value) => handleInputChange('sponsorship_status', value)}
                          >
                            <SelectTrigger className="border-slate-200 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Guardian Information Tab */}
                <TabsContent value="guardian" className="space-y-6 py-6">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-blue-600" />
                        Guardian Information
                      </CardTitle>
                      <CardDescription>
                        Enter the guardian's contact details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="guardian_name" className="text-sm font-medium flex items-center">
                          <User className="w-4 h-4 mr-2 text-slate-400" />
                          Guardian Name
                        </Label>
                        <Input
                          id="guardian_name"
                          placeholder="Enter guardian's full name"
                          value={formData.guardian_name}
                          onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                          className="border-slate-200 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="guardian_phone" className="text-sm font-medium flex items-center">
                          <PhoneCall className="w-4 h-4 mr-2 text-slate-400" />
                          Guardian Phone Number
                        </Label>
                        <Input
                          id="guardian_phone"
                          placeholder="Enter guardian's phone number"
                          value={formData.guardian_phone}
                          onChange={(e) => handleInputChange('guardian_phone', e.target.value)}
                          className="border-slate-200 focus:border-blue-500"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <Separator className="my-6" />
                
                <DialogFooter className="px-6 pb-6">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCreateDialogOpen(false);
                        setFormData({
                          first_name: '',
                          last_name: '',
                          email: '',
                          phone_number: '',
                          date_of_birth: '',
                          gender: '',
                          national_id: '',
                          county: '',
                          school: '',
                          grade: '',
                          guardian_name: '',
                          guardian_phone: '',
                          sponsorship_status: 'active',
                        });
                        setProfileImage(null);
                        setPreviewImage(null);
                      }}
                      className="flex-1 border-slate-200 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creatingBeneficiary}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transition-all"
                    >
                      {creatingBeneficiary ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Beneficiary...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Beneficiary
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Beneficiary Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center">
                <Edit className="w-6 h-6 mr-3" />
                Update Beneficiary
              </DialogTitle>
              <DialogDescription className="text-green-100">
                {editingBeneficiary && `Update details for ${editingBeneficiary.full_name}`}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <User className="w-4 h-4 mr-2" />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <School className="w-4 h-4 mr-2" />
                  Education
                </TabsTrigger>
                <TabsTrigger value="guardian" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Guardian Info
                </TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleUpdateSubmit}>
                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile Photo Section */}
                    <div className="md:col-span-1">
                      <Card className="border-2 border-dashed border-slate-200 hover:border-green-300 transition-colors">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="text-center">
                              <Label className="text-sm font-medium text-slate-700 mb-4 block">Profile Photo</Label>
                              <div className="relative">
                                {updatePreviewImage ? (
                                  <div className="relative mx-auto">
                                    <img 
                                      src={updatePreviewImage} 
                                      alt="Preview" 
                                      className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUpdatePreviewImage(null);
                                        setUpdateProfileImage(null);
                                      }}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-green-50 to-emerald-100 border-4 border-white shadow-lg flex items-center justify-center mx-auto">
                                    <Camera className="w-16 h-16 text-green-300" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-6 space-y-3">
                                <Label 
                                  htmlFor="update-file-upload" 
                                  className="cursor-pointer inline-flex items-center justify-center w-full py-2.5 px-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  {updatePreviewImage ? 'Change Photo' : 'Upload New Photo'}
                                </Label>
                                <Input
                                  id="update-file-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleUpdateFileChange}
                                />
                                <p className="text-xs text-slate-500 text-center">
                                  JPG, PNG, GIF or WebP • Max 5MB
                                </p>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor="update_date_of_birth" className="text-sm font-medium flex items-center">
                                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                  Date of Birth
                                </Label>
                                <Input
                                  id="update_date_of_birth"
                                  type="date"
                                  value={updateFormData.date_of_birth}
                                  onChange={(e) => handleUpdateInputChange('date_of_birth', e.target.value)}
                                  className="border-slate-200 focus:border-green-500"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="update_gender" className="text-sm font-medium flex items-center">
                                  <User className="w-4 h-4 mr-2 text-slate-400" />
                                  Gender
                                </Label>
                                <Select 
                                  value={updateFormData.gender} 
                                  onValueChange={(value) => handleUpdateInputChange('gender', value)}
                                >
                                  <SelectTrigger className="border-slate-200 focus:border-green-500">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Personal Information Fields */}
                    <div className="md:col-span-2">
                      <Card>
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold flex items-center">
                            <User className="w-5 h-5 mr-2 text-green-600" />
                            Personal Information
                          </CardTitle>
                          <CardDescription>
                            Update the beneficiary's personal details
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="update_first_name" className="text-sm font-medium">
                                First Name *
                              </Label>
                              <Input
                                id="update_first_name"
                                placeholder="Enter first name"
                                value={updateFormData.first_name}
                                onChange={(e) => handleUpdateInputChange('first_name', e.target.value)}
                                className="border-slate-200 focus:border-green-500"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="update_last_name" className="text-sm font-medium">
                                Last Name *
                              </Label>
                              <Input
                                id="update_last_name"
                                placeholder="Enter last name"
                                value={updateFormData.last_name}
                                onChange={(e) => handleUpdateInputChange('last_name', e.target.value)}
                                className="border-slate-200 focus:border-green-500"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="update_phone_number" className="text-sm font-medium flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-slate-400" />
                              Phone Number *
                            </Label>
                            <Input
                              id="update_phone_number"
                              placeholder="0712 345 678"
                              value={updateFormData.phone_number}
                              onChange={(e) => handleUpdateInputChange('phone_number', e.target.value)}
                              className="border-slate-200 focus:border-green-500"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="update_national_id" className="text-sm font-medium flex items-center">
                              <Hash className="w-4 h-4 mr-2 text-slate-400" />
                              National ID Number
                            </Label>
                            <Input
                              id="update_national_id"
                              placeholder="12345678"
                              value={updateFormData.national_id}
                              onChange={(e) => handleUpdateInputChange('national_id', e.target.value)}
                              className="border-slate-200 focus:border-green-500"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="update_county" className="text-sm font-medium flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                              County
                            </Label>
                            <Select 
                              value={updateFormData.county} 
                              onValueChange={(value) => handleUpdateInputChange('county', value)}
                            >
                              <SelectTrigger className="border-slate-200 focus:border-green-500">
                                <SelectValue placeholder="Select county" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {kenyaCounties.map(county => (
                                  <SelectItem key={county} value={county}>{county}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Education Information Tab */}
                <TabsContent value="education" className="space-y-6 py-6">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <School className="w-5 h-5 mr-2 text-green-600" />
                        Education Information
                      </CardTitle>
                      <CardDescription>
                        Update the beneficiary's school and academic details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="update_school" className="text-sm font-medium flex items-center">
                          <School className="w-4 h-4 mr-2 text-slate-400" />
                          School Name *
                        </Label>
                        <Input
                          id="update_school"
                          placeholder="Enter school name"
                          value={updateFormData.school}
                          onChange={(e) => handleUpdateInputChange('school', e.target.value)}
                          className="border-slate-200 focus:border-green-500"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="update_grade" className="text-sm font-medium flex items-center">
                            <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                            Grade/Class
                          </Label>
                          <Input
                            id="update_grade"
                            placeholder="Form 3, Grade 7, etc."
                            value={updateFormData.grade}
                            onChange={(e) => handleUpdateInputChange('grade', e.target.value)}
                            className="border-slate-200 focus:border-green-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="update_sponsorship_status" className="text-sm font-medium flex items-center">
                            <Grid3X3 className="w-4 h-4 mr-2 text-slate-400" />
                            Sponsorship Status *
                          </Label>
                          <Select 
                            value={updateFormData.sponsorship_status} 
                            onValueChange={(value) => handleUpdateInputChange('sponsorship_status', value)}
                          >
                            <SelectTrigger className="border-slate-200 focus:border-green-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="update_education_level" className="text-sm font-medium flex items-center">
                            <School className="w-4 h-4 mr-2 text-slate-400" />
                            Education Level
                          </Label>
                          <Select 
                            value={updateFormData.education_level_id} 
                            onValueChange={handleEducationLevelChange}
                          >
                            <SelectTrigger className="border-slate-200 focus:border-green-500">
                              <SelectValue placeholder="Select education level" />
                            </SelectTrigger>
                            <SelectContent>
                              {educationLevels.map(level => (
                                <SelectItem key={level.id} value={level.id.toString()}>
                                  {level.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="update_grade_class" className="text-sm font-medium flex items-center">
                            <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                            Grade/Class (Detailed)
                          </Label>
                          <Select 
                            value={updateFormData.grade_class_id} 
                            onValueChange={(value) => handleUpdateInputChange('grade_class_id', value)}
                            disabled={!updateFormData.education_level_id}
                          >
                            <SelectTrigger className="border-slate-200 focus:border-green-500">
                              <SelectValue placeholder={updateFormData.education_level_id ? "Select grade" : "Select education level first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeClasses.map(grade => (
                                <SelectItem key={grade.id} value={grade.id.toString()}>
                                  {grade.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Guardian Information Tab */}
                <TabsContent value="guardian" className="space-y-6 py-6">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-green-600" />
                        Guardian Information
                      </CardTitle>
                      <CardDescription>
                        Update the guardian's contact details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="update_guardian_name" className="text-sm font-medium flex items-center">
                          <User className="w-4 h-4 mr-2 text-slate-400" />
                          Guardian Name
                        </Label>
                        <Input
                          id="update_guardian_name"
                          placeholder="Enter guardian's full name"
                          value={updateFormData.guardian_name}
                          onChange={(e) => handleUpdateInputChange('guardian_name', e.target.value)}
                          className="border-slate-200 focus:border-green-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="update_guardian_phone" className="text-sm font-medium flex items-center">
                          <PhoneCall className="w-4 h-4 mr-2 text-slate-400" />
                          Guardian Phone Number
                        </Label>
                        <Input
                          id="update_guardian_phone"
                          placeholder="Enter guardian's phone number"
                          value={updateFormData.guardian_phone}
                          onChange={(e) => handleUpdateInputChange('guardian_phone', e.target.value)}
                          className="border-slate-200 focus:border-green-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="update_guardian_email" className="text-sm font-medium flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-slate-400" />
                          Guardian Email
                        </Label>
                        <Input
                          id="update_guardian_email"
                          type="email"
                          placeholder="guardian@example.com"
                          value={updateFormData.guardian_email}
                          onChange={(e) => handleUpdateInputChange('guardian_email', e.target.value)}
                          className="border-slate-200 focus:border-green-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="update_guardian_relationship" className="text-sm font-medium flex items-center">
                          <User className="w-4 h-4 mr-2 text-slate-400" />
                          Guardian Relationship
                        </Label>
                        <Input
                          id="update_guardian_relationship"
                          placeholder="e.g., Mother, Father, Aunt, etc."
                          value={updateFormData.guardian_relationship}
                          onChange={(e) => handleUpdateInputChange('guardian_relationship', e.target.value)}
                          className="border-slate-200 focus:border-green-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="update_emergency_contact_name" className="text-sm font-medium flex items-center">
                            <User className="w-4 h-4 mr-2 text-slate-400" />
                            Emergency Contact Name
                          </Label>
                          <Input
                            id="update_emergency_contact_name"
                            placeholder="Emergency contact name"
                            value={updateFormData.emergency_contact_name}
                            onChange={(e) => handleUpdateInputChange('emergency_contact_name', e.target.value)}
                            className="border-slate-200 focus:border-green-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="update_emergency_contact_phone" className="text-sm font-medium flex items-center">
                            <PhoneCall className="w-4 h-4 mr-2 text-slate-400" />
                            Emergency Contact Phone
                          </Label>
                          <Input
                            id="update_emergency_contact_phone"
                            placeholder="Emergency contact phone"
                            value={updateFormData.emergency_contact_phone}
                            onChange={(e) => handleUpdateInputChange('emergency_contact_phone', e.target.value)}
                            className="border-slate-200 focus:border-green-500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <Separator className="my-6" />
                
                <DialogFooter className="px-6 pb-6">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUpdateDialogOpen(false);
                        setEditingBeneficiary(null);
                        setUpdateFormData({
                          first_name: '',
                          last_name: '',
                          phone_number: '',
                          date_of_birth: '',
                          gender: '',
                          national_id: '',
                          county: '',
                          school: '',
                          grade: '',
                          guardian_name: '',
                          guardian_phone: '',
                          guardian_email: '',
                          guardian_relationship: '',
                          emergency_contact_name: '',
                          emergency_contact_phone: '',
                          sponsorship_status: 'active',
                          is_verified: true,
                          education_level_id: '',
                          grade_class_id: '',
                        });
                        setUpdateProfileImage(null);
                        setUpdatePreviewImage(null);
                      }}
                      className="flex-1 border-slate-200 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updatingBeneficiary}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 shadow-md hover:shadow-lg transition-all"
                    >
                      {updatingBeneficiary ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating Beneficiary...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Beneficiary
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Message {selectedBeneficiary?.full_name}
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                Send a direct message to this beneficiary
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-slate-700">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                rows={5}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="border-slate-200 focus:border-blue-500 min-h-[120px]"
              />
            </div>
          </div>
          
          <DialogFooter className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setMessageDialogOpen(false);
                  setMessageContent('');
                  setSelectedBeneficiary(null);
                }}
                className="flex-1 border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageContent}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                {sendingMessage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Beneficiaries;