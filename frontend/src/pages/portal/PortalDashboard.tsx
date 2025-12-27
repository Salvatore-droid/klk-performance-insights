import React, { useState, useEffect } from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  MessageSquare,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  documents_submitted: number;
  pending_approval: number;
  approved: number;
  action_required: number;
  unread_messages: number;
}

interface RecentDocument {
  id: number;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'requires_action';
  uploaded_at: string;
  reviewer_notes: string | null;
}

interface Deadline {
  id: number;
  title: string;
  description: string;
  due_date: string;
  days_left: number;
}

interface AcademicPerformance {
  gpa: string | null;
  class_rank: number | null;
  total_students: number | null;
  attendance_percentage: string | null;
  term: string | null;
  year: number | null;
}

const PortalDashboard = () => {
  const { user, apiRequest } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    user: { full_name: string; email: string };
    stats: DashboardStats;
    recent_documents: RecentDocument[];
    upcoming_deadlines: Deadline[];
    academic_performance: AcademicPerformance;
    financial_aid_status: string;
  } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiRequest('/dashboard/');
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success && data.dashboard) {
        setDashboardData(data.dashboard);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
      case 'requires_action':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Action Required</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <BeneficiaryLayout title="My Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading your dashboard...</p>
          </div>
        </div>
      </BeneficiaryLayout>
    );
  }

  if (!dashboardData) {
    return (
      <BeneficiaryLayout title="My Dashboard" subtitle="Error Loading Data">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-700 mb-4">Failed to load dashboard data.</p>
            <Button onClick={fetchDashboardData} className="bg-emerald-600 hover:bg-emerald-700">
              <Loader2 className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </BeneficiaryLayout>
    );
  }

  const stats = [
    { 
      title: 'Documents Submitted', 
      value: dashboardData.stats.documents_submitted.toString(), 
      icon: FileText, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Pending Approval', 
      value: dashboardData.stats.pending_approval.toString(), 
      icon: Clock, 
      color: 'bg-amber-500' 
    },
    { 
      title: 'Approved', 
      value: dashboardData.stats.approved.toString(), 
      icon: CheckCircle, 
      color: 'bg-emerald-500' 
    },
    { 
      title: 'Action Required', 
      value: dashboardData.stats.action_required.toString(), 
      icon: AlertCircle, 
      color: 'bg-red-500' 
    },
  ];

  return (
    <BeneficiaryLayout 
      title="My Dashboard" 
      subtitle={`Welcome back, ${dashboardData.user.full_name}`}
    >
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Link to="/portal/upload">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </Link>
        <Link to="/portal/messages">
          <Button variant="outline" className="relative">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
            {dashboardData.stats.unread_messages > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-0.5 text-xs">
                {dashboardData.stats.unread_messages}
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Documents</CardTitle>
            <Link to="/portal/documents">
              <Button variant="ghost" size="sm" className="text-emerald-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {dashboardData.recent_documents.length === 0 ? (
              <div className="text-center p-6">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No documents uploaded yet</p>
                <Link to="/portal/upload">
                  <Button variant="link" className="text-emerald-600 mt-2">
                    Upload your first document
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.recent_documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        <p className="text-sm text-slate-500">{formatDate(doc.uploaded_at)}</p>
                        {doc.reviewer_notes && doc.status === 'requires_action' && (
                          <p className="text-xs text-red-600 mt-1">{doc.reviewer_notes}</p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.upcoming_deadlines.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-slate-500">No upcoming deadlines</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.upcoming_deadlines.map((deadline) => (
                  <div key={deadline.id} className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-900">{deadline.title}</p>
                    <p className="text-sm text-slate-500">{formatDate(deadline.due_date)}</p>
                    <Badge 
                      className={`mt-2 ${
                        deadline.days_left <= 7 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {deadline.days_left} days left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Academic Performance Summary */}
      <Card className="mt-6 border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Academic Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.academic_performance.gpa ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Current GPA</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {dashboardData.academic_performance.gpa}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {dashboardData.academic_performance.term} {dashboardData.academic_performance.year}
                </p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Class Rank</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dashboardData.academic_performance.class_rank}
                  {dashboardData.academic_performance.total_students && 
                    `/${dashboardData.academic_performance.total_students}`}
                </p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Attendance</p>
                <p className="text-3xl font-bold text-amber-600">
                  {dashboardData.academic_performance.attendance_percentage}%
                </p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Financial Aid Status</p>
                <Badge className={`mt-2 text-lg px-4 py-1 ${
                  dashboardData.financial_aid_status === 'active' 
                    ? 'bg-emerald-100 text-emerald-700'
                    : dashboardData.financial_aid_status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {dashboardData.financial_aid_status.charAt(0).toUpperCase() + 
                   dashboardData.financial_aid_status.slice(1)}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center p-6">
              <p className="text-slate-500">No academic records found</p>
              <p className="text-sm text-slate-400 mt-1">
                Academic records will be updated by your institution
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Refresh */}
      <div className="mt-4 flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDashboardData}
          className="flex items-center gap-2"
        >
          <Loader2 className="w-3 h-3" />
          Refresh Data
        </Button>
      </div>
    </BeneficiaryLayout>
  );
};

export default PortalDashboard;