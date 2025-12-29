import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  Search, 
  Plus, 
  Download,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Eye,
  Filter,
  RefreshCw,
  Calendar,
  FileText,
  AlertCircle
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Payment {
  id: number;
  receipt_number: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  payment_method_value: string;
  term: string | null;
  year: number | null;
  description: string | null;
  status: 'pending' | 'verified' | 'rejected' | 'disputed';
  status_display: string;
  verification_notes: string | null;
  verified_at: string | null;
  receipt_file: string | null;
  beneficiary: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

interface FeeStatement {
  id: number;
  term: string;
  year: number;
  school: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
  due_date: string;
  status: string;
  payment_percentage: number;
  notes: string | null;
  beneficiary: {
    id: number;
    name: string;
  };
}

interface FinancialStats {
  total_paid: string;
  current_year_total: string;
  verified_count: number;
  pending_count: number;
  payment_distribution: Array<{
    method: string;
    method_display: string;
    total: string;
    count: number;
  }>;
}

const FinancialAid = () => {
  const { apiRequest } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [feeStatements, setFeeStatements] = useState<FeeStatement[]>([]);
  const [stats, setStats] = useState<FinancialStats>({
    total_paid: '0',
    current_year_total: '0',
    verified_count: 0,
    pending_count: 0,
    payment_distribution: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationAction, setVerificationAction] = useState<'verify' | 'reject'>('verify');
  const [processingVerification, setProcessingVerification] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch financial data
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch payments
      const paymentsParams = new URLSearchParams({
        year: yearFilter,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentMethodFilter !== 'all' && { payment_method: paymentMethodFilter }),
        ...(searchQuery && { search: searchQuery })
      });

      const { data: paymentsData, error: paymentsError } = await apiRequest(`/admin/payments/?${paymentsParams}`);
      
      if (paymentsError) throw new Error(paymentsError);

      if (paymentsData?.success) {
        setPayments(paymentsData.payments || []);
        setPendingPayments(paymentsData.payments?.filter((p: Payment) => p.status === 'pending') || []);
      }

      // Fetch payment statistics
      const { data: statsData } = await apiRequest('/admin/payments/summary/');
      if (statsData?.success) {
        setStats(statsData.summary);
      }

      // Fetch fee statements
      const { data: statementsData } = await apiRequest('/admin/fee-statements/');
      if (statementsData?.success) {
        setFeeStatements(statementsData.statements || []);
      }

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load financial data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [yearFilter, statusFilter, paymentMethodFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFinancialData();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleVerification = async () => {
    if (!selectedPayment) return;

    try {
      setProcessingVerification(true);
      
      const { data, error } = await apiRequest(`/admin/payments/${selectedPayment.id}/verify/`, {
        method: 'POST',
        body: JSON.stringify({
          status: verificationAction,
          notes: verificationNotes
        })
      });

      if (error) throw new Error(error);

      if (data?.success) {
        toast({
          title: 'Success',
          description: `Payment ${verificationAction === 'verify' ? 'verified' : 'rejected'} successfully.`,
        });
        setVerifyDialogOpen(false);
        setVerificationNotes('');
        setSelectedPayment(null);
        fetchFinancialData();
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: 'Error',
        description: `Failed to ${verificationAction} payment.`,
        variant: 'destructive',
      });
    } finally {
      setProcessingVerification(false);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      case 'processing':
      case 'partial':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      case 'rejected':
      case 'overdue':
      case 'unpaid':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      case 'disputed':
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate statistics for cards
  const totalDisbursed = parseFloat(stats.total_paid) || 0;
  const pendingPaymentsTotal = pendingPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const currentYearTotal = parseFloat(stats.current_year_total) || 0;
  const avgAidPerStudent = stats.verified_count > 0 ? totalDisbursed / stats.verified_count : 0;

  const statCards = [
    { 
      title: 'Total Disbursed', 
      value: formatCurrency(stats.total_paid), 
      change: '+23.1%', 
      trend: 'up',
      icon: DollarSign, 
      color: 'bg-green-500',
      loading: loadingStats
    },
    { 
      title: 'Pending Payments', 
      value: formatCurrency(pendingPaymentsTotal.toString()), 
      change: `${pendingPayments.length} requests`, 
      trend: pendingPayments.length > 10 ? 'up' : 'down',
      icon: Clock, 
      color: 'bg-orange-500',
      loading: loading
    },
    { 
      title: 'Verified Payments', 
      value: stats.verified_count.toString(), 
      change: `${((stats.verified_count / (stats.verified_count + stats.pending_count)) * 100).toFixed(1)}% rate`, 
      trend: 'up',
      icon: CheckCircle2, 
      color: 'bg-blue-500',
      loading: loadingStats
    },
    { 
      title: 'Avg. Aid per Payment', 
      value: formatCurrency(avgAidPerStudent.toString()), 
      change: '+8.4%', 
      trend: 'up',
      icon: CreditCard, 
      color: 'bg-purple-500',
      loading: loadingStats
    },
  ];

  // Generate monthly disbursement data
  const generateMonthlyDisbursement = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Group payments by month
    const monthlyData = months.map((month, index) => {
      const monthPayments = payments.filter(p => {
        const date = new Date(p.payment_date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });
      
      const total = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      return {
        month,
        amount: total / 1000000, // Convert to millions for display
        count: monthPayments.length
      };
    });
    
    return monthlyData;
  };

  const monthlyDisbursement = generateMonthlyDisbursement();

  // Generate payment method distribution
  const paymentDistribution = stats.payment_distribution.map(item => ({
    name: item.method_display,
    value: Math.round((parseFloat(item.total) / totalDisbursed) * 100) || 0,
    color: getPaymentMethodColor(item.method)
  }));

  function getPaymentMethodColor(method: string) {
    const colors: Record<string, string> = {
      'mpesa': '#10b981',
      'bank_transfer': '#3b82f6',
      'cash': '#f59e0b',
      'cheque': '#8b5cf6',
      'mobile_banking': '#ef4444',
      'other': '#64748b'
    };
    return colors[method] || '#64748b';
  }

  // Get unique payment methods for filter
  const paymentMethods = Array.from(new Set(payments.map(p => p.payment_method_value)));

  return (
    <DashboardLayout 
      title="Financial Aid" 
      subtitle="Manage scholarships, grants, and financial assistance programs"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
                  {stat.change}
                </div>
              </div>
              {stat.loading ? (
                <div className="h-8 flex items-center">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h3>
              )}
              <p className="text-slate-600 text-sm">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                Monthly Disbursement Trend
              </div>
              <Badge variant="outline" className="text-xs">
                {yearFilter}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyDisbursement}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis 
                      stroke="#64748b"
                      tickFormatter={(value) => `KES ${value}M`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                      formatter={(value, name) => {
                        if (name === 'amount') return [`KES ${Number(value).toFixed(2)}M`, 'Amount'];
                        return [value, 'Count'];
                      }}
                      labelFormatter={(label) => `${label} ${yearFilter}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      name="Amount (Millions)"
                      stroke="#4361ee" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Payment Count"
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Payment Method Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center">
              {loading ? (
                <div className="w-full text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                </div>
              ) : paymentDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${entry.value}%`}
                      >
                        {paymentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-40 space-y-2">
                    {paymentDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-slate-600 truncate">{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full text-center text-slate-500">
                  No payment data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending Verification ({pendingPayments.length})</TabsTrigger>
          <TabsTrigger value="statements">Fee Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="flex items-center">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                  All Payments
                  <Badge variant="outline" className="ml-3">
                    {payments.length} Total
                  </Badge>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input 
                      placeholder="Search by receipt # or name..." 
                      className="pl-10 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="disputed">Disputed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {paymentMethods.length > 0 && (
                    <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        {paymentMethods.map(method => (
                          <SelectItem key={method} value={method}>
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Button variant="outline" onClick={fetchFinancialData}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No payments found</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {searchQuery || statusFilter !== 'all' || paymentMethodFilter !== 'all'
                      ? 'Try changing your filters'
                      : 'No payments recorded yet'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Term/Year</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-slate-50">
                          <TableCell className="font-mono font-medium">
                            {payment.receipt_number}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900">{payment.beneficiary?.name}</p>
                              <p className="text-sm text-slate-500">{payment.beneficiary?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-slate-900">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(payment.payment_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.term && payment.year ? (
                              <span className="text-sm text-slate-600">
                                {payment.term} {payment.year}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => window.open(payment.receipt_file, '_blank')}
                                  disabled={!payment.receipt_file}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Receipt
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {payment.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setVerificationAction('verify');
                                        setVerifyDialogOpen(true);
                                      }}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                      Verify Payment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setVerificationAction('reject');
                                        setVerifyDialogOpen(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject Payment
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {payment.verification_notes && (
                                  <DropdownMenuItem disabled>
                                    <span className="text-xs text-slate-500">
                                      Notes: {payment.verification_notes}
                                    </span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-600 to-orange-400 rounded-full mr-3"></div>
                  Payments Pending Verification
                  <Badge className="ml-3 bg-orange-100 text-orange-800">
                    {pendingPayments.length} pending
                  </Badge>
                </CardTitle>
                <Button variant="outline" onClick={fetchFinancialData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : pendingPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <p className="text-slate-600">No pending payments</p>
                  <p className="text-sm text-slate-500 mt-1">
                    All payments have been verified
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.map((payment) => (
                    <Card key={payment.id} className="border-orange-200 bg-orange-50/50">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-slate-900">
                                Receipt #{payment.receipt_number}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2 text-slate-400" />
                                <span className="text-slate-700">{payment.beneficiary?.name}</span>
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
                                <span className="font-bold text-slate-900">{formatCurrency(payment.amount)}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                <span className="text-slate-600">{formatDate(payment.payment_date)}</span>
                              </div>
                              {payment.term && payment.year && (
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 mr-2 text-slate-400" />
                                  <span className="text-slate-600">{payment.term} {payment.year}</span>
                                </div>
                              )}
                            </div>
                            {payment.description && (
                              <p className="text-sm text-slate-600 mt-2">
                                {payment.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(payment.receipt_file, '_blank')}
                              disabled={!payment.receipt_file}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Receipt
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setVerificationAction('verify');
                                setVerifyDialogOpen(true);
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setVerificationAction('reject');
                                setVerifyDialogOpen(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                  Fee Statements Overview
                  <Badge variant="outline" className="ml-3">
                    {feeStatements.length} statements
                  </Badge>
                </CardTitle>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Statements
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : feeStatements.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No fee statements found</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Fee statements will appear here when uploaded
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Term/Year</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Total Fees</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Payment %</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeStatements.map((statement) => (
                        <TableRow key={statement.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium">
                            {statement.term} {statement.year}
                          </TableCell>
                          <TableCell>{statement.beneficiary?.name}</TableCell>
                          <TableCell className="text-slate-600">{statement.school}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(statement.total_amount)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(statement.amount_paid)}</TableCell>
                          <TableCell className={`font-bold ${
                            parseFloat(statement.balance) > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(statement.balance)}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {formatDate(statement.due_date)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium">{statement.payment_percentage.toFixed(1)}%</div>
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    statement.payment_percentage >= 100 ? 'bg-green-500' :
                                    statement.payment_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(statement.payment_percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(statement.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {verificationAction === 'verify' ? 'Verify Payment' : 'Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              {verificationAction === 'verify' 
                ? 'Verify this payment and update the beneficiary\'s fee statement.'
                : 'Reject this payment and provide a reason.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Payment Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Receipt #:</span>
                    <span className="font-mono font-medium">{selectedPayment.receipt_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Amount:</span>
                    <span className="font-bold">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Beneficiary:</span>
                    <span>{selectedPayment.beneficiary?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date:</span>
                    <span>{formatDate(selectedPayment.payment_date)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">
                  {verificationAction === 'verify' ? 'Verification Notes' : 'Rejection Reason'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    verificationAction === 'verify' 
                      ? 'Add any notes about this verification...' 
                      : 'Explain why this payment is being rejected...'
                  }
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVerifyDialogOpen(false);
                setVerificationNotes('');
                setSelectedPayment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerification}
              disabled={processingVerification || !verificationNotes.trim()}
              className={
                verificationAction === 'verify' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {processingVerification ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : verificationAction === 'verify' ? (
                'Verify Payment'
              ) : (
                'Reject Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FinancialAid;
