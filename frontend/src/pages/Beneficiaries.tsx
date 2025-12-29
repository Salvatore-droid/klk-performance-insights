import React, { useState, useEffect } from 'react';
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
  Plus, 
  Filter, 
  Download, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Loader2,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Upload,
  X,
  Key,
  Send,
  Copy,
  Check,
  UserPlus,
  Camera
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface Beneficiary {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  school: string | null;
  grade: string | null;
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
}

interface BeneficiaryStats {
  total: number;
  active: number;
  pending_verification: number;
}

// Form data interface for new beneficiary
interface BeneficiaryFormData {
  // Personal Information
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  national_id: string;
  
  // Address Information
  address: string;
  county: string;
  constituency: string;
  
  // School Information
  school: string;
  grade: string;
  admission_number: string;
  school_type: string;
  
  // Guardian Information
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_relationship: string;
  
  // Emergency Contact
  emergency_contact_name: string;
  emergency_contact_phone: string;
  
  // Sponsorship Information
  sponsorship_status: string;
  sponsorship_start_date: string;
  
  // Profile Image
  profile_image: File | null;
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
  const [gradeFilter, setGradeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Dialog states
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  
  // Message states
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Creation states
  const [creatingBeneficiary, setCreatingBeneficiary] = useState(false);
  const [newBeneficiaryData, setNewBeneficiaryData] = useState<BeneficiaryFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    national_id: '',
    address: '',
    county: '',
    constituency: '',
    school: '',
    grade: '',
    admission_number: '',
    school_type: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    sponsorship_status: 'active',
    sponsorship_start_date: new Date().toISOString().split('T')[0],
    profile_image: null,
  });
  
  // Welcome email states
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [newBeneficiaryId, setNewBeneficiaryId] = useState<number | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [sendingWelcomeEmail, setSendingWelcomeEmail] = useState(false);

  // Profile image preview
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // Fetch beneficiaries data
  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(countyFilter !== 'all' && { county: countyFilter }),
        ...(gradeFilter !== 'all' && { grade: gradeFilter }),
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
  };

  // Fetch statistics
  const fetchStatistics = async () => {
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
  };

  useEffect(() => {
    fetchBeneficiaries();
    fetchStatistics();
  }, [currentPage, itemsPerPage, statusFilter, countyFilter, gradeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchBeneficiaries();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle profile image upload
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a JPG, PNG, or GIF image',
          variant: 'destructive',
        });
        return;
      }
      
      setNewBeneficiaryData(prev => ({ ...prev, profile_image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form input change
  const handleInputChange = (field: keyof BeneficiaryFormData, value: string) => {
    setNewBeneficiaryData(prev => ({ ...prev, [field]: value }));
  };

  // Create new beneficiary
  // In Beneficiaries.tsx, update the handleCreateBeneficiary function
const handleCreateBeneficiary = async () => {
  try {
    setCreatingBeneficiary(true);
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'phone_number', 'school'];
    const missingFields = requiredFields.filter(field => {
      const value = newBeneficiaryData[field as keyof BeneficiaryFormData];
      return !value || value.trim() === '';
    });
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing information',
        description: `Please fill in: ${missingFields.map(f => f.replace(/_/g, ' ')).join(', ')}`,
        variant: 'destructive',
      });
      setCreatingBeneficiary(false);
      return;
    }
    
    // Create FormData
    const formData = new FormData();
    
    // Add all form data
    Object.entries(newBeneficiaryData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'profile_image' && value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'string') {
          formData.append(key, value.trim());
        } else {
          formData.append(key, value);
        }
      }
    });
    
    // Debug: Log form data entries
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    
    // Make API request WITHOUT setting Content-Type header
    const { data, error } = await apiRequest('/admin/beneficiaries/create/', {
      method: 'POST',
      body: formData,
      // IMPORTANT: Let the browser set the Content-Type automatically
      // It will set it to 'multipart/form-data' with the correct boundary
    });
    
    if (error) {
      throw new Error(error);
    }
    
    if (data?.success) {
      toast({
        title: 'Success',
        description: 'Beneficiary created successfully',
      });
      
      setTemporaryPassword(data.beneficiary.temporary_password);
      setNewBeneficiaryId(data.beneficiary.id);
      
      resetBeneficiaryForm();
      
      setCreateDialogOpen(false);
      setWelcomeDialogOpen(true);
      
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

  // Send welcome email
  const handleSendWelcomeEmail = async () => {
    try {
      setSendingWelcomeEmail(true);
      
      const { data, error } = await apiRequest(`/admin/beneficiaries/${newBeneficiaryId}/welcome-email/`, {
        method: 'POST',
        body: JSON.stringify({ password: temporaryPassword })
      });
      
      if (error) throw new Error(error);
      
      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Welcome email sent successfully',
        });
        
        // Reset and close dialog
        setTemporaryPassword('');
        setNewBeneficiaryId(null);
        setWelcomeDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error sending welcome email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send welcome email',
        variant: 'destructive',
      });
    } finally {
      setSendingWelcomeEmail(false);
    }
  };

  // Copy password to clipboard
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setPasswordCopied(true);
      toast({
        title: 'Copied',
        description: 'Password copied to clipboard',
      });
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (error) {
      console.error('Error copying password:', error);
    }
  };

  // Reset beneficiary form
  const resetBeneficiaryForm = () => {
    setNewBeneficiaryData({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      date_of_birth: '',
      gender: '',
      national_id: '',
      address: '',
      county: '',
      constituency: '',
      school: '',
      grade: '',
      admission_number: '',
      school_type: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
      guardian_relationship: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      sponsorship_status: 'active',
      sponsorship_start_date: new Date().toISOString().split('T')[0],
      profile_image: null,
    });
    setProfileImagePreview(null);
  };

  const handleSendMessage = async () => {
    if (!selectedBeneficiary || !messageSubject || !messageContent) {
      toast({
        title: 'Error',
        description: 'Please fill in all message fields.',
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
          subject: messageSubject,
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
        setMessageSubject('');
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
        
        // Update the local state immediately instead of refetching
        setBeneficiaries(prev => 
          prev.map(beneficiary => 
            beneficiary.id === beneficiaryId 
              ? { ...beneficiary, sponsorship_status: newStatus }
              : beneficiary
          )
        );
        
        // Update statistics based on the new status
        setStats(prev => {
          const updated = { ...prev };
          
          // Find the beneficiary to get current status
          const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
          if (beneficiary) {
            const oldStatus = beneficiary.sponsorship_status.toLowerCase();
            const newStatusLower = newStatus.toLowerCase();
            
            // Update counts based on status change
            if (oldStatus === 'active' && newStatusLower !== 'active') {
              updated.active = Math.max(0, updated.active - 1);
            } else if (oldStatus !== 'active' && newStatusLower === 'active') {
              updated.active += 1;
            }
            
            if (oldStatus === 'pending' && newStatusLower !== 'pending') {
              updated.pending_verification = Math.max(0, updated.pending_verification - 1);
            } else if (oldStatus !== 'pending' && newStatusLower === 'pending') {
              updated.pending_verification += 1;
            }
          }
          
          return updated;
        });
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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Suspended</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPerformanceBadge = (score: number | null) => {
    if (!score) return <Badge variant="outline">N/A</Badge>;
    
    if (score >= 90) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{score}%</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{score}%</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{score}%</Badge>;
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{score}%</Badge>;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const statCards = [
    { 
      title: 'Total Beneficiaries', 
      value: stats.total.toLocaleString(), 
      icon: Users, 
      color: 'bg-blue-500',
      loading: loadingStats
    },
    { 
      title: 'Active Students', 
      value: stats.active.toLocaleString(), 
      icon: UserCheck, 
      color: 'bg-green-500',
      loading: loadingStats
    },
    { 
      title: 'Pending Verification', 
      value: stats.pending_verification.toLocaleString(), 
      icon: UserX, 
      color: 'bg-orange-500',
      loading: loadingStats
    },
    { 
      title: 'Years Average', 
      value: beneficiaries.length > 0 
        ? (beneficiaries.reduce((sum, b) => sum + b.years_in_program, 0) / beneficiaries.length).toFixed(1)
        : '0.0', 
      icon: GraduationCap, 
      color: 'bg-purple-500',
      loading: loading
    },
  ];

  // Get unique counties and grades for filters
  const counties = Array.from(new Set(beneficiaries.map(b => b.county).filter(Boolean))) as string[];
  const grades = Array.from(new Set(beneficiaries.map(b => b.grade).filter(Boolean))) as string[];

  // Counties in Kenya for dropdown
  const kenyaCounties = [
    'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta', 'Garissa', 'Wajir', 'Mandera',
    'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
    'Nyeri', 'Kirinyaga', 'Muranga', 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
    'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado',
    'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay',
    'Migori', 'Kisii', 'Nyamira', 'Nairobi'
  ];

  // Gender options
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  // School type options
  const schoolTypeOptions = ['Day School', 'Boarding School', 'Mixed', 'Other'];

  // Guardian relationship options
  const guardianRelationshipOptions = ['Parent', 'Guardian', 'Sibling', 'Relative', 'Other'];

  return (
    <DashboardLayout 
      title="Beneficiaries" 
      subtitle="Manage and track all program beneficiaries"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm mb-1">{stat.title}</p>
                  {stat.loading ? (
                    <div className="h-8 flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              All Beneficiaries
              <Badge variant="outline" className="ml-3">
                {totalCount} Total
              </Badge>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search by name, email, or school..." 
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              {counties.length > 0 && (
                <Select value={countyFilter} onValueChange={setCountyFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="County" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    {counties.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {grades.length > 0 && (
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCountyFilter('all'); setGradeFilter('all'); }}>
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              
              <Button onClick={fetchBeneficiaries} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              {/* Add New Beneficiary Button */}
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Beneficiary
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create New Beneficiary
                    </DialogTitle>
                    <DialogDescription>
                      Fill in all required information to create a new beneficiary account.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="personal" className="mt-4">
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="personal">Personal Info</TabsTrigger>
                      <TabsTrigger value="school">School Info</TabsTrigger>
                      <TabsTrigger value="guardian">Guardian Info</TabsTrigger>
                      <TabsTrigger value="sponsorship">Sponsorship</TabsTrigger>
                    </TabsList>
                    
                    {/* Personal Information Tab */}
                    <TabsContent value="personal" className="space-y-4 py-4">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Column - Profile Image */}
                        <div className="md:w-1/3">
                          <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 transition-colors">
                              {profileImagePreview ? (
                                <div className="relative">
                                  <img 
                                    src={profileImagePreview} 
                                    alt="Profile preview" 
                                    className="w-32 h-32 rounded-full object-cover mx-auto"
                                  />
                                  <button
                                    onClick={() => {
                                      setProfileImagePreview(null);
                                      setNewBeneficiaryData(prev => ({ ...prev, profile_image: null }));
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                    <Camera className="w-12 h-12 text-slate-400" />
                                  </div>
                                  <Label htmlFor="profile-image" className="cursor-pointer">
                                    <Button variant="outline" type="button">
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload Photo
                                    </Button>
                                    <Input
                                      id="profile-image"
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={handleProfileImageUpload}
                                    />
                                  </Label>
                                </>
                              )}
                              <p className="text-xs text-slate-500 mt-2 text-center">
                                JPG, PNG or GIF (Max 5MB)
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="date_of_birth">Date of Birth</Label>
                              <Input
                                id="date_of_birth"
                                type="date"
                                value={newBeneficiaryData.date_of_birth}
                                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="gender">Gender</Label>
                              <Select
                                value={newBeneficiaryData.gender}
                                onValueChange={(value) => handleInputChange('gender', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  {genderOptions.map(gender => (
                                    <SelectItem key={gender} value={gender.toLowerCase()}>
                                      {gender}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Column - Personal Info */}
                        <div className="md:w-2/3 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="first_name">First Name *</Label>
                              <Input
                                id="first_name"
                                value={newBeneficiaryData.first_name}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                placeholder="Enter first name"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="last_name">Last Name *</Label>
                              <Input
                                id="last_name"
                                value={newBeneficiaryData.last_name}
                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                placeholder="Enter last name"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newBeneficiaryData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="example@domain.com"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone_number">Phone Number *</Label>
                            <Input
                              id="phone_number"
                              value={newBeneficiaryData.phone_number}
                              onChange={(e) => handleInputChange('phone_number', e.target.value)}
                              placeholder="0712 345 678"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="national_id">National ID</Label>
                            <Input
                              id="national_id"
                              value={newBeneficiaryData.national_id}
                              onChange={(e) => handleInputChange('national_id', e.target.value)}
                              placeholder="12345678"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="address">Physical Address</Label>
                            <Textarea
                              id="address"
                              value={newBeneficiaryData.address}
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              placeholder="Enter physical address"
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="county">County</Label>
                              <Select
                                value={newBeneficiaryData.county}
                                onValueChange={(value) => handleInputChange('county', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select county" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {kenyaCounties.map(county => (
                                    <SelectItem key={county} value={county}>
                                      {county}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="constituency">Constituency</Label>
                              <Input
                                id="constituency"
                                value={newBeneficiaryData.constituency}
                                onChange={(e) => handleInputChange('constituency', e.target.value)}
                                placeholder="Enter constituency"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* School Information Tab */}
                    <TabsContent value="school" className="space-y-4 py-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="school">School Name *</Label>
                          <Input
                            id="school"
                            value={newBeneficiaryData.school}
                            onChange={(e) => handleInputChange('school', e.target.value)}
                            placeholder="Enter school name"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="grade">Grade/Class</Label>
                            <Input
                              id="grade"
                              value={newBeneficiaryData.grade}
                              onChange={(e) => handleInputChange('grade', e.target.value)}
                              placeholder="e.g., Form 3, Grade 7"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="admission_number">Admission Number</Label>
                            <Input
                              id="admission_number"
                              value={newBeneficiaryData.admission_number}
                              onChange={(e) => handleInputChange('admission_number', e.target.value)}
                              placeholder="School admission number"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="school_type">School Type</Label>
                          <Select
                            value={newBeneficiaryData.school_type}
                            onValueChange={(value) => handleInputChange('school_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select school type" />
                            </SelectTrigger>
                            <SelectContent>
                              {schoolTypeOptions.map(type => (
                                <SelectItem key={type} value={type.toLowerCase()}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Guardian Information Tab */}
                    <TabsContent value="guardian" className="space-y-4 py-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="guardian_name">Guardian Name</Label>
                            <Input
                              id="guardian_name"
                              value={newBeneficiaryData.guardian_name}
                              onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                              placeholder="Full name of guardian"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="guardian_phone">Guardian Phone</Label>
                            <Input
                              id="guardian_phone"
                              value={newBeneficiaryData.guardian_phone}
                              onChange={(e) => handleInputChange('guardian_phone', e.target.value)}
                              placeholder="Guardian phone number"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="guardian_email">Guardian Email</Label>
                            <Input
                              id="guardian_email"
                              type="email"
                              value={newBeneficiaryData.guardian_email}
                              onChange={(e) => handleInputChange('guardian_email', e.target.value)}
                              placeholder="Guardian email address"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="guardian_relationship">Relationship</Label>
                            <Select
                              value={newBeneficiaryData.guardian_relationship}
                              onValueChange={(value) => handleInputChange('guardian_relationship', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                {guardianRelationshipOptions.map(relation => (
                                  <SelectItem key={relation} value={relation.toLowerCase()}>
                                    {relation}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Emergency Contact</h4>
                          <p className="text-sm text-slate-500">Person to contact in case of emergency</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                            <Input
                              id="emergency_contact_name"
                              value={newBeneficiaryData.emergency_contact_name}
                              onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                              placeholder="Full name"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                            <Input
                              id="emergency_contact_phone"
                              value={newBeneficiaryData.emergency_contact_phone}
                              onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                              placeholder="Phone number"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Sponsorship Tab */}
                    <TabsContent value="sponsorship" className="space-y-4 py-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="sponsorship_status">Sponsorship Status</Label>
                            <Select
                              value={newBeneficiaryData.sponsorship_status}
                              onValueChange={(value) => handleInputChange('sponsorship_status', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="conditional">Conditional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="sponsorship_start_date">Sponsorship Start Date</Label>
                            <Input
                              id="sponsorship_start_date"
                              type="date"
                              value={newBeneficiaryData.sponsorship_start_date}
                              onChange={(e) => handleInputChange('sponsorship_start_date', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <Key className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-blue-800">Account Creation</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                A random secure password will be generated for this beneficiary. 
                                You can send it to them via email after creation.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreateDialogOpen(false);
                        resetBeneficiaryForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateBeneficiary}
                      disabled={creatingBeneficiary}
                      className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"
                    >
                      {creatingBeneficiary ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Beneficiary
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : beneficiaries.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No beneficiaries found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || statusFilter !== 'all' || countyFilter !== 'all' || gradeFilter !== 'all' 
                  ? 'Try changing your search filters' 
                  : 'No beneficiaries registered yet. Click "Add Beneficiary" to create your first one.'}
              </p>
              {!searchQuery && statusFilter === 'all' && countyFilter === 'all' && gradeFilter === 'all' && (
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Beneficiary
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>School & Grade</TableHead>
                      <TableHead>Sponsorship Status</TableHead>
                      <TableHead>Academic Performance</TableHead>
                      <TableHead>Financial Balance</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiaries.map((beneficiary, index) => (
                      <TableRow key={beneficiary.id} className="hover:bg-slate-50">
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={beneficiary.profile_image_url || undefined} />
                              <AvatarFallback>
                                {beneficiary.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">{beneficiary.full_name}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <div className="flex items-center text-xs text-slate-500">
                                  <Mail className="w-3 h-3 mr-1" />
                                  <span className="truncate">{beneficiary.email}</span>
                                </div>
                                {beneficiary.phone_number && (
                                  <div className="flex items-center text-xs text-slate-500">
                                    <Phone className="w-3 h-3 mr-1" />
                                    <span>{beneficiary.phone_number}</span>
                                  </div>
                                )}
                              </div>
                              {beneficiary.county && (
                                <div className="flex items-center text-xs text-slate-500 mt-1">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span>{beneficiary.county}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">{beneficiary.school || 'Not specified'}</p>
                            <p className="text-sm text-slate-500">Grade {beneficiary.grade || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(beneficiary.sponsorship_status)}
                            {beneficiary.is_verified && (
                              <Badge variant="outline" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getPerformanceBadge(beneficiary.academic_performance)}
                            {beneficiary.academic_rank && (
                              <p className="text-xs text-slate-500">
                                Rank #{beneficiary.academic_rank}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className={`font-medium ${
                              parseFloat(beneficiary.balance) > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatCurrency(beneficiary.balance)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Paid: {formatCurrency(beneficiary.total_paid)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-slate-600">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(beneficiary.registration_date)}
                            </div>
                            <p className="text-xs text-slate-500">
                              {beneficiary.years_in_program} year{beneficiary.years_in_program !== 1 ? 's' : ''} in program
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(beneficiary.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedBeneficiary(beneficiary);
                                  setMessageDialogOpen(true);
                                }}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => window.open(`/portal/dashboard?user=${beneficiary.id}`, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Portal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenu>
                                <DropdownMenuTrigger className="w-full">
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Change Status
                                  </DropdownMenuItem>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="right">
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(beneficiary.id, 'active')}>
                                    Active
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(beneficiary.id, 'pending')}>
                                    Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(beneficiary.id, 'suspended')}>
                                    Suspend
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(beneficiary.id, 'completed')}>
                                    Mark Completed
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} beneficiaries
                </div>
                <div className="flex items-center gap-2">
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
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
                            className="w-8 h-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Message to {selectedBeneficiary?.full_name}</DialogTitle>
            <DialogDescription>
              Send a direct message to this beneficiary.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Message subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                rows={5}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMessageDialogOpen(false);
                setMessageSubject('');
                setMessageContent('');
                setSelectedBeneficiary(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageSubject || !messageContent}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Welcome Email Dialog */}
      <Dialog open={welcomeDialogOpen} onOpenChange={setWelcomeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-500" />
              Beneficiary Created Successfully
            </DialogTitle>
            <DialogDescription>
              Here are the login credentials for the new beneficiary. You can send them via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <Key className="w-5 h-5 text-green-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Login Credentials</p>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs text-green-700">Email:</p>
                      <p className="font-mono text-sm bg-green-100 px-2 py-1 rounded">
                        {newBeneficiaryData.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-700">Temporary Password:</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm bg-green-100 px-2 py-1 rounded flex-1">
                          {temporaryPassword}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyPassword}
                          className="border-green-300 hover:bg-green-50"
                        >
                          {passwordCopied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Important Note</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This password will only be shown once. Please save it or send it to the beneficiary via email.
                    They should change their password after first login.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setWelcomeDialogOpen(false)}
              className="sm:flex-1"
            >
              Close
            </Button>
            <Button
              onClick={handleSendWelcomeEmail}
              disabled={sendingWelcomeEmail}
              className="sm:flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
            >
              {sendingWelcomeEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Welcome Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Beneficiaries;