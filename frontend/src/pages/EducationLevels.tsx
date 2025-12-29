import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  TrendingUp,
  GraduationCap,
  BookOpen,
  ArrowRight,
  School,
  Building2,
  Wrench,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  BarChart3,
  PieChart,
  AlertCircle,
  Loader2,
  FileText,
  CreditCard,
  Eye,
  Home,
  RefreshCw,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Debug mode
const DEBUG = true;

// API Service with proper JWT handling
class ApiService {
  static async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      credentials: 'include' as RequestCredentials
    };

    const url = `${API_BASE_URL}${endpoint}`;
    
    if (DEBUG) {
      console.log(`API Request: ${url}`, {
        headers: config.headers,
        method: config.method || 'GET'
      });
    }

    try {
      const response = await fetch(url, config);
      
      if (DEBUG) {
        console.log(`API Response: ${response.status} ${response.statusText}`, response);
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Session expired. Please login again.');
      }

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (isJson) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.detail || errorMessage;
          } catch {
            // If JSON parsing fails, use default message
          }
        } else {
          const text = await response.text();
          if (DEBUG) {
            console.error('Non-JSON error response:', text.substring(0, 500));
          }
          
          // Check for common HTML error pages
          if (text.includes('<html') || text.includes('<!DOCTYPE')) {
            if (response.status === 404) {
              errorMessage = `API endpoint not found: ${endpoint}`;
            } else if (response.status === 403) {
              errorMessage = 'Access forbidden. Please check your permissions.';
            } else if (response.status === 401) {
              errorMessage = 'Authentication required. Please login again.';
              // Redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/auth';
            } else {
              errorMessage = `Server error (${response.status}). Please contact administrator.`;
            }
          } else if (text.trim()) {
            errorMessage = text.substring(0, 200);
          }
        }
        
        throw new Error(errorMessage);
      }

      if (!isJson) {
        throw new Error(`Expected JSON but got ${contentType}. Check API endpoint.`);
      }

      const data = await response.json();
      
      if (DEBUG) {
        console.log(`API Response Data:`, data);
      }
      
      if (data.success === false) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
      
    } catch (error: any) {
      if (DEBUG) {
        console.error('API Request Error:', error);
      }
      throw error;
    }
  }

  // Education Levels API
  static async getEducationLevels() {
    return this.request('/admin/education-levels/');
  }

  static async getEducationLevelDetail(levelKey: string) {
    return this.request(`/admin/education-levels/${levelKey}/`);
  }

  static async getGradeStudents(gradeId: string, page: number = 1, search: string = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      ...(search && { search })
    });
    return this.request(`/admin/grades/${gradeId}/students/?${params}`);
  }

  static async getEducationDashboard() {
    return this.request('/admin/education-dashboard/');
  }

  // Test API connection (no auth required)
  static async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/test/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Interface definitions
interface EducationLevel {
  id: number;
  level_key: string;
  title: string;
  description: string;
  icon_name: string;
  color_gradient: string;
  order: number;
  is_active: boolean;
  stats?: {
    total_students: number;
    active_students: number;
    average_performance: number;
    passing_rate: number;
  };
}

interface EducationLevelStats {
  total_students: number;
  active_students: number;
  pending_verification: number;
  new_this_month: number;
  average_performance: number;
  passing_rate: number;
  total_fees: number;
  total_paid: number;
  total_aid_disbursed: number;
  pending_documents: number;
  approved_documents: number;
}

interface GradeClass {
  id: number;
  name: string;
  short_code: string;
  description: string;
  order: number;
  is_active: boolean;
  education_level?: EducationLevel;
}

interface GradeStats {
  total_students: number;
  male_students: number;
  female_students: number;
  average_performance: number;
  average_attendance: number;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  school: string;
  admission_number: string;
  gender: string;
  county: string;
  sponsorship_status: string;
  is_verified: boolean;
  registration_date: string;
  academic_performance: number;
  attendance: number;
  total_fees: string;
  total_paid: string;
  balance: string;
  profile_image_url: string | null;
  grade_class?: {
    id: number;
    name: string;
  };
}

interface EducationLevelDetail {
  success: boolean;
  education_level: EducationLevel;
  statistics: EducationLevelStats;
  grades: Array<{
    grade: GradeClass;
    student_count: number;
    average_performance: number;
    average_attendance: number;
    male_students: number;
    female_students: number;
  }>;
  recent_activities: Array<{
    id: string;
    type: string;
    title: string;
    user: string;
    grade: string;
    time: string;
    status: string;
  }>;
  performance_trends: Array<{
    term: string;
    average_performance: number;
  }>;
  county_distribution: Array<{
    county: string;
    count: number;
  }>;
}

interface GradeDetail {
  success: boolean;
  grade: GradeClass;
  statistics: GradeStats;
  students: Student[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

const EducationLevels = () => {
  const { level, gradeId } = useParams<{ level?: string; gradeId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [educationLevelsStats, setEducationLevelsStats] = useState<Record<string, EducationLevelStats>>({});
  const [selectedLevel, setSelectedLevel] = useState<EducationLevelDetail | null>(null);
  const [gradeDetail, setGradeDetail] = useState<GradeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');

  // Check authentication and API connection
  useEffect(() => {
    const checkAuthAndConnection = async () => {
      if (authLoading) return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Authentication required. Please login first.');
        navigate('/auth');
        return;
      }

      try {
        // Test basic connection first
        const testResult = await ApiService.testConnection();
        if (testResult) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
          setApiError('Cannot connect to API server. Please check if the server is running.');
        }
      } catch (error: any) {
        setConnectionStatus('error');
        setApiError(error.message || 'Connection error');
      }
    };

    checkAuthAndConnection();
  }, [authLoading, navigate]);

  // Fetch education levels data
  useEffect(() => {
    const fetchEducationLevels = async () => {
      if (connectionStatus !== 'connected' || apiError) return;
      
      try {
        setLoading(true);
        setApiError(null);
        
        const data = await ApiService.getEducationLevels();
        
        if (data.success) {
          setEducationLevels(data.education_levels || []);
          
          // Extract stats from each level
          const stats: Record<string, EducationLevelStats> = {};
          data.education_levels?.forEach((level: EducationLevel) => {
            if (level.stats) {
              stats[level.level_key] = level.stats;
            }
          });
          setEducationLevelsStats(stats);
        }
      } catch (error: any) {
        console.error('Error fetching education levels:', error);
        setApiError(error.message);
        
        toast({
          title: 'Error',
          description: error.message || 'Failed to load education levels',
          variant: 'destructive',
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEducationLevels();
  }, [connectionStatus, apiError, toast]);

  // Fetch specific level data if level param exists
  useEffect(() => {
    const fetchLevelDetail = async () => {
      if (!level || connectionStatus !== 'connected' || apiError) return;
      
      try {
        setStatsLoading(true);
        setApiError(null);
        
        const data = await ApiService.getEducationLevelDetail(level);
        
        if (data.success) {
          setSelectedLevel(data);
        }
      } catch (error: any) {
        console.error('Error fetching level details:', error);
        setApiError(error.message);
        
        toast({
          title: 'Error',
          description: error.message || 'Failed to load education level details',
          variant: 'destructive',
          duration: 5000
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchLevelDetail();
  }, [level, connectionStatus, apiError, toast]);

  // Fetch grade students if gradeId exists
  useEffect(() => {
    const fetchGradeStudents = async () => {
      if (!gradeId || connectionStatus !== 'connected' || apiError) return;
      
      try {
        setLoading(true);
        setApiError(null);
        
        const data = await ApiService.getGradeStudents(gradeId, currentPage, searchTerm);
        
        if (data.success) {
          setGradeDetail(data);
          setTotalPages(data.pagination?.total_pages || 1);
        }
      } catch (error: any) {
        console.error('Error fetching grade students:', error);
        setApiError(error.message);
        
        toast({
          title: 'Error',
          description: error.message || 'Failed to load students',
          variant: 'destructive',
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGradeStudents();
  }, [gradeId, currentPage, searchTerm, connectionStatus, apiError, toast]);

  // Helper functions
  const getIconByKey = (key: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      'pre_school': BookOpen,
      'primary': School,
      'secondary': GraduationCap,
      'university': Building2,
      'vocational': Wrench
    };
    return icons[key] || School;
  };

  const getColorGradient = (color: string) => {
    if (color?.includes('from-')) return color;
    
    const colors: Record<string, string> = {
      'from-pink-500 to-rose-500': 'from-pink-500 to-rose-500',
      'from-blue-500 to-cyan-500': 'from-blue-500 to-cyan-500',
      'from-purple-500 to-indigo-500': 'from-purple-500 to-indigo-500',
      'from-orange-500 to-amber-500': 'from-orange-500 to-amber-500',
      'from-green-500 to-emerald-500': 'from-green-500 to-emerald-500'
    };
    
    return colors[color] || 'from-blue-500 to-cyan-500';
  };

  // Export grade data
  const exportGradeData = async () => {
    if (!gradeDetail?.students.length) return;
    
    try {
      setIsExporting(true);
      const csvContent = [
        ['Name', 'Email', 'Phone', 'School', 'Grade', 'Performance', 'Attendance', 'Fees Balance', 'Status'],
        ...gradeDetail.students.map(student => [
          student.full_name,
          student.email,
          student.phone_number || 'N/A',
          student.school,
          student.grade_class?.name || 'N/A',
          `${student.academic_performance || 0}%`,
          `${student.attendance || 0}%`,
          `KES ${parseFloat(student.balance || '0').toLocaleString()}`,
          student.sponsorship_status
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grade_students_${gradeId}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Grade data exported successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Calculate overall statistics
  const calculateOverallStats = () => {
    const totalStudents = Object.values(educationLevelsStats).reduce((sum, stats) => sum + stats.total_students, 0);
    const activeStudents = Object.values(educationLevelsStats).reduce((sum, stats) => sum + stats.active_students, 0);
    
    const avgPerformance = Object.values(educationLevelsStats)
      .filter(stats => stats.average_performance > 0)
      .reduce((sum, stats) => sum + stats.average_performance, 0);
    
    const avgPerformanceCount = Object.values(educationLevelsStats).filter(stats => stats.average_performance > 0).length;
    const overallAvgPerformance = avgPerformanceCount > 0 ? (avgPerformance / avgPerformanceCount) : 0;
    
    const passingRate = Object.values(educationLevelsStats)
      .filter(stats => stats.passing_rate > 0)
      .reduce((sum, stats) => sum + stats.passing_rate, 0);
    
    const passingRateCount = Object.values(educationLevelsStats).filter(stats => stats.passing_rate > 0).length;
    const overallPassingRate = passingRateCount > 0 ? (passingRate / passingRateCount) : 0;

    return {
      totalStudents,
      activeStudents,
      overallAvgPerformance,
      overallPassingRate,
      activeLevels: educationLevels.length
    };
  };

  // Loading skeleton for overview
  const renderOverviewSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="h-2 bg-slate-200"></div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-6 w-3/4 mt-4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render connection status banner
  const renderConnectionStatus = () => {
    if (connectionStatus === 'connected') {
      return (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-700 text-sm">
            Connected to API server at {API_BASE_URL}
          </span>
        </div>
      );
    } else if (connectionStatus === 'error') {
      return (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700 font-medium">Connection Error</span>
          </div>
          <p className="text-red-600 text-sm mb-2">{apiError}</p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="text-sm"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry Connection
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="text-sm"
            >
              <Shield className="w-3 h-3 mr-1" />
              Login Again
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render error state
  const renderErrorState = (message: string) => (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Data</h3>
      <p className="text-slate-600 mb-4">{message}</p>
      <div className="space-y-4 max-w-md mx-auto">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Possible Solutions:</strong>
          </p>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Ensure you are logged in with admin privileges</li>
            <li>Check if JWT token is valid and not expired</li>
            <li>Verify Django server is running on port 8000</li>
            <li>Check API endpoint: {API_BASE_URL}/admin/education-levels/</li>
            <li>Ensure CORS is properly configured</li>
          </ul>
        </div>
        <div className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
      {DEBUG && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-lg mx-auto">
          <p className="text-sm font-medium text-red-800 mb-2">Debug Information:</p>
          <code className="text-xs text-red-600 break-all">
            Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}<br/>
            API URL: {API_BASE_URL}<br/>
            Error: {message}
          </code>
        </div>
      )}
    </div>
  );

  // If auth is still loading
  if (authLoading) {
    return (
      <DashboardLayout title="Education Levels" subtitle="Loading...">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Checking authentication...</p>
        </div>
      </DashboardLayout>
    );
  }

  // If no specific level, show overview
  if (!level && !gradeId) {
    const overallStats = calculateOverallStats();
    
    return (
      <DashboardLayout title="Education Levels" subtitle="Overview of all education programs">
        <div className="mb-6">
          {renderConnectionStatus()}
          
          {/* Overall Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Total Students</p>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <h3 className="text-2xl font-bold text-slate-900">
                        {overallStats.totalStudents.toLocaleString()}
                      </h3>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Avg Performance</p>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <h3 className="text-2xl font-bold text-slate-900">
                        {overallStats.overallAvgPerformance.toFixed(1)}%
                      </h3>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Passing Rate</p>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <h3 className="text-2xl font-bold text-slate-900">
                        {overallStats.overallPassingRate.toFixed(1)}%
                      </h3>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Active Levels</p>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <h3 className="text-2xl font-bold text-slate-900">
                        {overallStats.activeLevels}
                      </h3>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                    <School className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {apiError ? (
            renderErrorState(apiError)
          ) : loading ? (
            renderOverviewSkeleton()
          ) : educationLevels.length === 0 ? (
            <div className="text-center py-12">
              <School className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Education Levels Found</h3>
              <p className="text-slate-600 mb-4">
                There are no education levels configured in the system. 
                Please check the Django admin panel to add education levels.
              </p>
              <div className="space-y-4 max-w-md mx-auto">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> The API endpoint `/api/admin/education-levels/` is returning empty data.
                    Please ensure:
                  </p>
                  <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                    <li>EducationLevel objects exist in the database</li>
                    <li>Run the seed command: `python manage.py seed_education_levels`</li>
                    <li>Check Django admin at /admin/administrator/educationlevel/</li>
                  </ul>
                </div>
                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationLevels.map((levelData) => {
                const IconComponent = getIconByKey(levelData.level_key);
                const stats = educationLevelsStats[levelData.level_key] || {
                  total_students: 0,
                  active_students: 0,
                  average_performance: 0,
                  passing_rate: 0
                };
                
                return (
                  <Card key={levelData.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${getColorGradient(levelData.color_gradient)}`}></div>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getColorGradient(levelData.color_gradient)} flex items-center justify-center`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <Badge variant="outline">{stats.total_students} students</Badge>
                      </div>
                      <CardTitle className="mt-4">{levelData.title}</CardTitle>
                      <p className="text-slate-600 text-sm">{levelData.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Avg. Performance</span>
                            <span className="font-medium">{stats.average_performance.toFixed(1)}%</span>
                          </div>
                          <Progress value={stats.average_performance} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Passing Rate</span>
                            <span className="font-medium">{stats.passing_rate.toFixed(1)}%</span>
                          </div>
                          <Progress value={stats.passing_rate} className="h-2" />
                        </div>
                        <Link to={`/education/${levelData.level_key}`}>
                          <Button variant="outline" className="w-full mt-4">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // If viewing a specific grade
  if (gradeId) {
    const grade = gradeDetail?.grade;
    
    return (
      <DashboardLayout 
        title={grade?.name || "Grade Details"} 
        subtitle={grade?.description || "Student list for this grade"}
      >
        <div className="mb-6">
          {renderConnectionStatus()}
          
          {/* Header with back button and stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <Link to={`/education/${level}`}>
                <Button variant="outline" className="mb-4">
                  ← Back to {selectedLevel?.education_level?.title || 'Education Level'}
                </Button>
              </Link>
              <h2 className="text-2xl font-bold">{grade?.name} Students</h2>
              {gradeDetail?.statistics && (
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {gradeDetail.statistics.total_students} Students
                  </span>
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {gradeDetail.statistics.male_students} Boys, {gradeDetail.statistics.female_students} Girls
                  </span>
                  <span className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Avg: {gradeDetail.statistics.average_performance.toFixed(1)}%
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Attendance: {gradeDetail.statistics.average_attendance.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <Button onClick={exportGradeData} disabled={!gradeDetail?.students.length || isExporting}>
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export CSV
            </Button>
          </div>

          {apiError ? (
            renderErrorState(apiError)
          ) : (
            <>
              {/* Search and Filter */}
              <div className="bg-white rounded-lg border p-4 mb-6">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        type="search"
                        placeholder="Search students by name, email, or school..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit">Search</Button>
                </form>
              </div>

              {/* Students Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Students List</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center p-4 border rounded-lg">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="ml-4 space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-3 w-[150px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !gradeDetail?.students || gradeDetail.students.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">
                        {searchTerm ? 'No students found matching your search.' : 'No students found in this grade.'}
                      </p>
                      {searchTerm && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setSearchTerm('')}
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>School</TableHead>
                              <TableHead>Performance</TableHead>
                              <TableHead>Fees Balance</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gradeDetail.students.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      {student.profile_image_url ? (
                                        <AvatarImage 
                                          src={student.profile_image_url} 
                                          alt={student.full_name}
                                        />
                                      ) : null}
                                      <AvatarFallback>
                                        {student.full_name
                                          .split(' ')
                                          .map(n => n[0])
                                          .join('')
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{student.full_name}</p>
                                      <p className="text-sm text-slate-500">{student.admission_number || 'No ID'}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center text-sm">
                                      <Mail className="w-3 h-3 mr-2 text-slate-400" />
                                      <span className="truncate max-w-[150px]">{student.email}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                      <Phone className="w-3 h-3 mr-2 text-slate-400" />
                                      {student.phone_number || 'N/A'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <p className="font-medium truncate max-w-[200px]">{student.school || 'N/A'}</p>
                                    <p className="text-sm text-slate-500">{student.county || 'N/A'}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-2">
                                    <div>
                                      <div className="flex items-center justify-between text-sm mb-1">
                                        <span>Performance</span>
                                        <span className="font-medium">{student.academic_performance || 0}%</span>
                                      </div>
                                      <Progress value={student.academic_performance || 0} className="h-2" />
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between text-sm mb-1">
                                        <span>Attendance</span>
                                        <span className="font-medium">{student.attendance || 0}%</span>
                                      </div>
                                      <Progress value={student.attendance || 0} className="h-2" />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <p className={`font-bold ${
                                      parseFloat(student.balance || '0') > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      KES {parseFloat(student.balance || '0').toLocaleString()}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      Paid: KES {parseFloat(student.total_paid || '0').toLocaleString()}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      student.sponsorship_status === 'active' ? 'default' :
                                      student.sponsorship_status === 'pending' ? 'secondary' :
                                      'destructive'
                                    }
                                  >
                                    {student.sponsorship_status}
                                  </Badge>
                                  {!student.is_verified && (
                                    <Badge variant="outline" className="ml-2">
                                      Unverified
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/beneficiaries/${student.id}`)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-6">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious 
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                              </PaginationItem>
                              
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
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink
                                      onClick={() => setCurrentPage(pageNum)}
                                      isActive={currentPage === pageNum}
                                      className="cursor-pointer"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              })}
                              
                              <PaginationItem>
                                <PaginationNext 
                                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                          <p className="text-center text-sm text-slate-500 mt-2">
                            Page {currentPage} of {totalPages} • {gradeDetail?.pagination?.total_count || 0} total students
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Show specific level details
  if (!selectedLevel) {
    return (
      <DashboardLayout title="Education Level" subtitle="Loading...">
        {renderConnectionStatus()}
        <div className="text-center py-12">
          {statsLoading ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
              <p className="mt-4 text-slate-600">Loading education level details...</p>
            </>
          ) : apiError ? (
            renderErrorState(apiError)
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Failed to load education level details.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/education')}
              >
                Back to All Levels
              </Button>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  const levelData = selectedLevel.education_level;
  const stats = selectedLevel.statistics;
  const IconComponent = getIconByKey(levelData.level_key);

  return (
    <DashboardLayout title={levelData.title} subtitle={levelData.description}>
      {renderConnectionStatus()}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Total Students</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.total_students.toLocaleString()}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {stats.active_students} active • {stats.new_this_month} new this month
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getColorGradient(levelData.color_gradient)} flex items-center justify-center`}>
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Academic Performance</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.average_performance.toFixed(1)}%</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Passing rate: {stats.passing_rate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Financial Overview</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  KES {stats.total_aid_disbursed.toLocaleString()}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Total fees: KES {stats.total_fees.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                <PieChart className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Document Status</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.approved_documents.toLocaleString()}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {stats.pending_documents} pending review
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="grades" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grades">Classes & Grades</TabsTrigger>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="recent">Recent Activities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                Classes & Grades ({selectedLevel.grades?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLevel.grades && selectedLevel.grades.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedLevel.grades.map((grade) => (
                    <Card 
                      key={grade.grade.id} 
                      className="hover:shadow-md transition-all duration-300 cursor-pointer hover:border-blue-300"
                      onClick={() => navigate(`/education/${level}/grade/${grade.grade.id}`)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorGradient(levelData.color_gradient)} flex items-center justify-center mx-auto mb-3`}>
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-medium text-slate-900">{grade.grade.name}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {grade.student_count} students
                        </p>
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Performance:</span>
                            <span className="font-medium">{grade.average_performance.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Boys/Girls:</span>
                            <span className="font-medium">{grade.male_students}/{grade.female_students}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <School className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No grades defined for this education level.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate('/admin/grades/create')}
                    disabled={!user?.is_superuser}
                  >
                    Create Grade
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-green-400 rounded-full mr-3"></div>
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLevel.performance_trends && selectedLevel.performance_trends.length > 0 ? (
                <div className="space-y-4">
                  {selectedLevel.performance_trends.map((trend, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{trend.term}</span>
                        <span className="font-bold">{trend.average_performance.toFixed(1)}%</span>
                      </div>
                      <Progress value={trend.average_performance} className="h-3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No performance data available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-600 to-orange-400 rounded-full mr-3"></div>
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLevel.recent_activities && selectedLevel.recent_activities.length > 0 ? (
                <div className="space-y-4">
                  {selectedLevel.recent_activities.map((activity) => (
                    <div key={activity.id} className="flex items-start p-3 border rounded-lg hover:bg-slate-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        activity.type === 'document' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {activity.type === 'document' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <div className="flex items-center text-sm text-slate-500 mt-1">
                          <User className="w-3 h-3 mr-1" />
                          {activity.user}
                          {activity.grade && activity.grade !== 'N/A' && (
                            <>
                              <span className="mx-2">•</span>
                              <School className="w-3 h-3 mr-1" />
                              {activity.grade}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-slate-500 whitespace-nowrap">
                        {new Date(activity.time).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No recent activities.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* County Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-purple-400 rounded-full mr-3"></div>
                Geographical Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLevel.county_distribution && selectedLevel.county_distribution.length > 0 ? (
                <div className="space-y-3">
                  {selectedLevel.county_distribution.map((county, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                          <span>{county.county || 'Unknown'}</span>
                        </div>
                        <span className="font-medium">{county.count} students</span>
                      </div>
                      <Progress 
                        value={(county.count / stats.total_students) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">No geographical data available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Button
          variant="outline"
          onClick={() => navigate(`/beneficiaries/create?education_level=${levelData.id}`)}
        >
          <User className="w-4 h-4 mr-2" />
          Add Student to {levelData.title}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/reports?type=education')}
        >
          <Download className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
        <Button
          onClick={() => navigate('/education')}
          className="sm:ml-auto"
        >
          Back to All Levels
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default EducationLevels;