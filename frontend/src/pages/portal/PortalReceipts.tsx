import React, { useState, useEffect } from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Receipt, 
  Download, 
  Eye, 
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  DollarSign,
  Shield,
  FileText,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: number;
  receipt_number: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  payment_method_value: string;
  term: string;
  year: number;
  description: string | null;
  status: 'pending' | 'verified' | 'rejected' | 'disputed';
  status_display: string;
  verification_notes: string | null;
  verified_at: string | null;
  receipt_file: string | null;
  created_at: string;
}

interface SummaryStats {
  total_paid: string;
  current_year_total: string;
  verified_count: number;
  pending_count: number;
  payment_methods: string[];
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_previous: boolean;
}

interface PaymentMethod {
  value: string;
  label: string;
}

const PortalReceipts = () => {
  const { apiRequest } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_previous: false,
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  const [filters, setFilters] = useState({
    year: 'all',
    status: 'all',
    payment_method: 'all',
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchSummary();
  }, [filters.year, filters.status, filters.payment_method]);

  const fetchPaymentMethods = async () => {
    try {
      setLoadingMethods(true);
      const { data, error } = await apiRequest('/payments/methods/');
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success && data.payment_methods) {
        setPaymentMethods(data.payment_methods);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.year !== 'all' && { year: filters.year }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.payment_method !== 'all' && { payment_method: filters.payment_method }),
      });
      
      const { data, error } = await apiRequest(`/payments/?${params}`);
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        setPayments(data.payments || []);
        setPagination(data.pagination || {
          current_page: 1,
          total_pages: 1,
          total_count: 0,
          has_next: false,
          has_previous: false,
        });
        setSummaryStats(data.summary_stats || null);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment receipts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data, error } = await apiRequest('/payments/summary/');
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        // Merge with existing summary stats
        setSummaryStats(prev => ({
          ...prev,
          ...data.summary,
        }));
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleDownload = async (paymentId: number, fileName: string) => {
    try {
      // Create a temporary link to trigger download
      const response = await fetch(`/api/payments/${paymentId}/download/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kids_league_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string, statusDisplay: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {statusDisplay}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {statusDisplay}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            {statusDisplay}
          </Badge>
        );
      case 'disputed':
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {statusDisplay}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{statusDisplay}</Badge>;
    }
  };

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return XCircle;
      case 'disputed': return AlertCircle;
      default: return FileText;
    }
  };

  const totalPaid = summaryStats ? parseFloat(summaryStats.total_paid) : 0;

  return (
    <BeneficiaryLayout title="My Receipts" subtitle="View and manage your payment receipts">
      {/* Summary Card */}
      <Card className="border-0 shadow-md mb-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Total Verified Payments</p>
              <p className="text-4xl font-bold mt-2">{formatCurrency(totalPaid.toString())}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  <span className="text-emerald-100">
                    {summaryStats?.verified_count || 0} verified
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-200" />
                  <span className="text-amber-100">
                    {summaryStats?.pending_count || 0} pending
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Receipt className="w-16 h-16 text-emerald-200" />
              <div className="absolute -top-2 -right-2 bg-white text-emerald-600 rounded-full p-1">
                <Shield className="w-6 h-6" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-md mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select 
                value={filters.year} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getYears().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={filters.payment_method} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, payment_method: value }))}
                disabled={loadingMethods}
              >
                <SelectTrigger>
                  {loadingMethods ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Payment method" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Link to="/portal/upload" className="flex-1">
                <Button className="bg-emerald-600 hover:bg-emerald-700 w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Receipt
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ year: 'all', status: 'all', payment_method: 'all' })}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Payment Receipts ({pagination.total_count})
          </CardTitle>
          <div className="text-sm text-slate-500">
            Page {pagination.current_page} of {pagination.total_pages}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
                <p className="text-slate-600">Loading payment receipts...</p>
              </div>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Receipt className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-600 mb-2">No payment receipts found</p>
              <p className="text-sm text-slate-500 mb-4">
                {filters.year !== 'all' || filters.status !== 'all' || filters.payment_method !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Upload your first payment receipt to get started'}
              </p>
              <Link to="/portal/upload">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Receipt
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Term / Year</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const StatusIcon = getStatusIcon(payment.status);
                    return (
                      <TableRow key={payment.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-slate-400" />
                            {payment.receipt_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(payment.payment_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{payment.term}</span>
                            <span className="text-sm text-slate-500">{payment.year}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${
                              payment.status === 'verified' ? 'text-emerald-600' :
                              payment.status === 'pending' ? 'text-amber-600' :
                              'text-red-600'
                            }`} />
                            {getStatusBadge(payment.status, payment.status_display)}
                          </div>
                          {payment.verification_notes && (
                            <p className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                              {payment.verification_notes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.verified_at ? (
                            <span className="text-sm text-slate-600">
                              {formatDate(payment.verified_at)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {payment.description && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: 'Payment Description',
                                    description: payment.description,
                                  });
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {payment.receipt_file && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownload(payment.id, `receipt_${payment.receipt_number}.pdf`)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-slate-500">
                    Showing {payments.length} of {pagination.total_count} receipts
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPayments(pagination.current_page - 1)}
                      disabled={!pagination.has_previous}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.total_pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.current_page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.current_page >= pagination.total_pages - 2) {
                          pageNum = pagination.total_pages - 4 + i;
                        } else {
                          pageNum = pagination.current_page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.current_page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => fetchPayments(pageNum)}
                            className={pagination.current_page === pageNum ? "bg-emerald-600" : ""}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPayments(pagination.current_page + 1)}
                      disabled={!pagination.has_next}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Guide */}
      <Card className="border-0 shadow-md mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Receipt Status Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700">
                <strong>Verified:</strong> Payment confirmed and applied to your account
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-amber-50 border-amber-200">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                <strong>Pending:</strong> Awaiting verification by financial office
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Rejected:</strong> Payment not accepted - check verification notes
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-purple-50 border-purple-200">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-700">
                <strong>Disputed:</strong> Under review for discrepancies
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-700 mb-2">Need Help?</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>Receipts are typically verified within 2-3 business days</li>
              <li>Ensure receipt images are clear and show all required details</li>
              <li>Contact financial aid office for pending receipts older than 5 days</li>
              <li>Keep physical copies of receipts for your records</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </BeneficiaryLayout>
  );
};

export default PortalReceipts;