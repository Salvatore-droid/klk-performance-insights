import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign,
  FileText,
  CreditCard,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  UserCheck,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Bell,
  TrendingUp,
  FileCheck,
  Shield,
  Eye,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

// Format currency function
const formatCurrency = (amount) => {
  if (!amount) return 'KES 0';
  const num = parseFloat(amount);
  if (num >= 1000000) {
    return `KES ${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `KES ${(num / 1000).toFixed(1)}K`;
  }
  return `KES ${num.toFixed(0)}`;
};

// Format date
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

const Dashboard = () => {
  const { user, role, apiRequest } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (role === 'admin') {
      fetchDashboardData();
    }
  }, [role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: dashboardResponse, error: dashboardError } = await apiRequest('/admin/dashboard/');
      
      if (dashboardError) {
        throw new Error(dashboardError);
      }
      
      if (dashboardResponse?.success) {
        setDashboardData(dashboardResponse.dashboard);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'verified':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
      case 'suspended':
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partial':
      case 'requires_action':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(dateString);
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-600">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardLayout title="Admin Dashboard" subtitle="Error Loading Data">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing.
          </AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  const { stats, recent_activities, upcoming_due_dates, geographical_distribution, pending_reviews, user: adminUser } = dashboardData;

  // Main stats cards
  const statsCards = [
    {
      title: 'Total Beneficiaries',
      value: stats.total_beneficiaries.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      description: `${stats.active_beneficiaries} active`,
      trend: stats.new_this_month > 0 ? `+${stats.new_this_month} this month` : 'No new this month'
    },
    {
      title: 'Total Aid Disbursed',
      value: formatCurrency(stats.total_aid_disbursed),
      icon: DollarSign,
      color: 'bg-green-500',
      description: `${formatCurrency(stats.month_aid_disbursed)} this month`,
      trend: `${stats.verified_payments} verified payments`
    },
    {
      title: 'Pending Reviews',
      value: pending_reviews.total.toString(),
      icon: AlertCircle,
      color: 'bg-orange-500',
      description: `${pending_reviews.documents} documents, ${pending_reviews.payments} payments`,
      trend: 'Requires attention'
    },
    {
      title: 'Documents Processed',
      value: stats.approved_documents.toString(),
      icon: FileText,
      color: 'bg-purple-500',
      description: `${stats.rejected_documents} rejected, ${stats.pending_documents} pending`,
      trend: `${Math.round((stats.approved_documents / (stats.approved_documents + stats.rejected_documents + stats.pending_documents)) * 100)}% approval rate`
    }
  ];

  return (
    <DashboardLayout 
      title="Admin Dashboard" 
      subtitle={`Welcome back, ${adminUser.full_name}! Last updated: ${getRelativeTime(dashboardData.timestamp)}`}
      notificationsCount={stats.unread_notifications}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-600 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500">{stat.trend}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Activities & Upcoming Due Dates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recent_activities && recent_activities.length > 0 ? (
                  recent_activities.map((activity, index) => (
                    <div 
                      key={index} 
                      className="flex items-start p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        activity.type === 'document' 
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {activity.type === 'document' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900 text-sm truncate">{activity.title}</p>
                          <Badge 
                            size="sm" 
                            variant="outline"
                            className={getStatusColor(activity.status)}
                          >
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{activity.user}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {getRelativeTime(activity.time)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Due Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                Upcoming Due Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcoming_due_dates && upcoming_due_dates.length > 0 ? (
                  upcoming_due_dates.map((dueDate, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                          <Calendar className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{dueDate.title}</p>
                          <p className="text-sm text-slate-500">
                            Due: {formatDate(dueDate.due_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(dueDate.amount)}</p>
                        <Badge 
                          size="sm" 
                          variant="outline"
                          className={getStatusColor(dueDate.status)}
                        >
                          {dueDate.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No upcoming due dates</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Geographical Distribution & Quick Actions */}
        <div className="space-y-6">
          {/* Geographical Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Top Counties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {geographical_distribution && geographical_distribution.length > 0 ? (
                  geographical_distribution.map((county, index) => (
                    <div key={index} className="flex items-center justify-between p-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <span className="font-medium text-slate-700 truncate">{county.county || 'Unknown'}</span>
                      </div>
                      <span className="font-bold text-slate-900">{county.students}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No geographical data</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/admin/beneficiaries'}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Beneficiaries
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/admin/pending-reviews'}
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  Review Pending Items
                  {pending_reviews.total > 0 && (
                    <Badge className="ml-auto bg-red-100 text-red-800">
                      {pending_reviews.total}
                    </Badge>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/admin/fee-statements'}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  View Fee Statements
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/admin/notifications'}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  View Notifications
                  {stats.unread_notifications > 0 && (
                    <Badge className="ml-auto bg-blue-100 text-blue-800">
                      {stats.unread_notifications}
                    </Badge>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">Beneficiary Verification</span>
                    <span className="text-sm font-bold text-slate-900">
                      {stats.pending_verification} pending
                    </span>
                  </div>
                  <Progress 
                    value={((stats.total_beneficiaries - stats.pending_verification) / stats.total_beneficiaries) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">Document Processing</span>
                    <span className="text-sm font-bold text-slate-900">
                      {stats.approved_documents} approved
                    </span>
                  </div>
                  <Progress 
                    value={(stats.approved_documents / (stats.approved_documents + stats.rejected_documents + stats.pending_documents)) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">Payment Verification</span>
                    <span className="text-sm font-bold text-slate-900">
                      {stats.verified_payments} verified
                    </span>
                  </div>
                  <Progress 
                    value={(stats.verified_payments / (stats.verified_payments + stats.pending_payments)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        <div className="text-sm text-slate-500">
          Data as of {formatDate(dashboardData.timestamp)}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchDashboardData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;