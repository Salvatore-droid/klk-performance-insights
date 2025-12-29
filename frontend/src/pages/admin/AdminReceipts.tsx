import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Receipt, 
  Download, 
  Eye, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PaymentReceipt {
  id: number;
  receipt_number: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  payment_method_display: string;
  payment_method_value: string;
  term: string;
  year: number;
  description: string | null;
  status: string;
  status_display: string;
  verification_notes: string | null;
  verified_at: string | null;
  receipt_file: string | null;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface PaymentStats {
  total_paid: string;
  current_year_total: string;
  verified_count: number;
  pending_count: number;
  payment_methods: string[];
}

const AdminReceipts = () => {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [stats, setStats] = useState<PaymentStats>({ 
    total_paid: '0', 
    current_year_total: '0', 
    verified_count: 0, 
    pending_count: 0, 
    payment_methods: [] 
  });
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentReceipt | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Fetch payments data
  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentMethodFilter !== 'all' && { payment_method: paymentMethodFilter }),
        ...(yearFilter !== 'all' && { year: yearFilter }),
      });

      const { data, error } = await apiRequest(`/admin/payments/?${params}`);
      
      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        setPayments(data.payments || []);
        setTotalCount(data.pagination?.total_count || 0);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment receipts.',
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
      
      const { data, error } = await apiRequest('/admin/payments/?limit=1');
      
      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        setStats(data.summary_stats || { 
          total_paid: '0', 
          current_year_total: '0', 
          verified_count: 0, 
          pending_count: 0, 
          payment_methods: [] 
        });
      }
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStatistics();
  }, [currentPage, itemsPerPage, statusFilter, paymentMethodFilter, yearFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchPayments();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleVerifyPayment = async () => {
    if (!selectedPayment || !verificationNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter verification notes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingAction(true);
      
      const { data, error } = await apiRequest(`/admin/payments/${selectedPayment.id}/verify/`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'verified',
          notes: verificationNotes
        })
      });

      if (error) throw new Error(error);

      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Payment verified successfully.',
        });
        setVerifyDialogOpen(false);
        setVerificationNotes('');
        setSelectedPayment(null);
        fetchPayments();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify payment.',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectionNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter rejection notes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingAction(true);
      
      const { data, error } = await apiRequest(`/admin/payments/${selectedPayment.id}/verify/`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'rejected',
          notes: rejectionNotes
        })
      });

      if (error) throw new Error(error);

      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Payment rejected.',
        });
        setRejectDialogOpen(false);
        setRejectionNotes('');
        setSelectedPayment(null);
        fetchPayments();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payment.',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewReceipt = (receiptUrl: string) => {
    setViewingReceipt(receiptUrl);
    setViewDialogOpen(true);
  };

  const handleDownloadReceipt = async (paymentId: number, receiptNumber: string) => {
    try {
      // This would open the file in a new tab for download
      window.open(`/api/admin/payments/${paymentId}/download/`, '_blank');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: 'Error',
        description: 'Failed to download receipt.',
        variant: 'destructive',
      });
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
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      case 'disputed':
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Disputed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      mpesa: 'bg-green-100 text-green-700',
      bank_transfer: 'bg-blue-100 text-blue-700',
      cash: 'bg-gray-100 text-gray-700',
      cheque: 'bg-purple-100 text-purple-700',
      mobile_banking: 'bg-orange-100 text-orange-700',
      other: 'bg-slate-100 text-slate-700',
    };
    
    return (
      <Badge className={colors[method] || 'bg-slate-100 text-slate-700'} variant="outline">
        {method.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  // Generate year options (last 5 years + current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

  const paymentStatCards = [
    { 
      title: 'Total Disbursed', 
      value: formatCurrency(stats.total_paid), 
      icon: DollarSign, 
      color: 'bg-blue-500',
      loading: loadingStats
    },
    { 
      title: 'Verified Receipts', 
      value: stats.verified_count.toLocaleString(), 
      icon: ShieldCheck, 
      color: 'bg-emerald-500',
      loading: loadingStats
    },
    { 
      title: 'Pending Review', 
      value: stats.pending_count.toLocaleString(), 
      icon: Clock, 
      color: 'bg-amber-500',
      loading: loadingStats
    },
    { 
      title: 'Current Year Total', 
      value: formatCurrency(stats.current_year_total), 
      icon: Calendar, 
      color: 'bg-purple-500',
      loading: loadingStats
    },
  ];

  return (
    <DashboardLayout 
      title="Receipts Management" 
      subtitle="View, verify, and manage payment receipts"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {paymentStatCards.map((stat, index) => (
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

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by receipt number, student name, or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => { 
                  setSearchTerm(''); 
                  setStatusFilter('all'); 
                  setPaymentMethodFilter('all');
                  setYearFilter(currentYear.toString());
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              
              <Button onClick={fetchPayments} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Payment Receipts
              <Badge variant="outline" className="ml-3">
                {totalCount} Total
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
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
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No payment receipts found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm || statusFilter !== 'all' || paymentMethodFilter !== 'all' || yearFilter !== currentYear.toString()
                  ? 'Try changing your search filters' 
                  : 'No payment receipts submitted yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt Details</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Payment Details</TableHead>
                      <TableHead>Academic Term</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">{payment.receipt_number}</p>
                            <div className="flex items-center text-sm text-slate-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(payment.payment_date)}
                            </div>
                            <p className="text-lg font-bold text-blue-600">
                              {formatCurrency(payment.amount)}
                            </p>
                            {payment.description && (
                              <p className="text-xs text-slate-500 truncate">{payment.description}</p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {payment.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 truncate">{payment.user.name}</p>
                                <p className="text-xs text-slate-500 truncate">{payment.user.email}</p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getPaymentMethodBadge(payment.payment_method_value)}
                            </div>
                            {payment.verified_at && (
                              <div className="text-xs text-slate-500">
                                Verified: {formatDate(payment.verified_at)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline">
                              {payment.term} {payment.year}
                            </Badge>
                            <div className="text-xs text-slate-500">
                              Submitted: {formatDate(payment.created_at)}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(payment.status)}
                            {payment.verification_notes && payment.status !== 'pending' && (
                              <p className="text-xs text-slate-500 truncate max-w-[150px]">
                                Notes: {payment.verification_notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {payment.receipt_file && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewReceipt(payment.receipt_file!)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {payment.receipt_file && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDownloadReceipt(payment.id, payment.receipt_number)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Receipt
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/beneficiaries/${payment.user.id}`)}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Student
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                {payment.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setVerifyDialogOpen(true);
                                      }}
                                      className="text-emerald-600"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Verify Payment
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setRejectDialogOpen(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject Payment
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                {payment.status === 'verified' && (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setRejectDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Mark as Rejected
                                  </DropdownMenuItem>
                                )}
                                
                                {payment.status === 'rejected' && (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setVerifyDialogOpen(true);
                                    }}
                                    className="text-emerald-600"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark as Verified
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} receipts
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
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
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Verify Payment Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Verify Payment Receipt</DialogTitle>
            <DialogDescription>
              Verify payment receipt {selectedPayment?.receipt_number} for {selectedPayment?.user.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">Payment Details</p>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-sm"><span className="font-medium">Amount:</span> {selectedPayment && formatCurrency(selectedPayment.amount)}</p>
                <p className="text-sm"><span className="font-medium">Method:</span> {selectedPayment?.payment_method_display}</p>
                <p className="text-sm"><span className="font-medium">Term:</span> {selectedPayment?.term} {selectedPayment?.year}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification-notes">Verification Notes</Label>
              <Textarea
                id="verification-notes"
                placeholder="Add notes about this verification (optional)"
                rows={3}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                These notes will be visible to the beneficiary.
              </p>
            </div>
          </div>
          
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
              onClick={handleVerifyPayment}
              disabled={processingAction}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {processingAction ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Payment Receipt</DialogTitle>
            <DialogDescription>
              Reject payment receipt {selectedPayment?.receipt_number} for {selectedPayment?.user.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                This action will mark the payment as rejected. The beneficiary will be notified.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="rejection-notes">Rejection Reason (Required)</Label>
              <Textarea
                id="rejection-notes"
                placeholder="Explain why this payment is being rejected..."
                rows={3}
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                This reason will be visible to the beneficiary.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionNotes('');
                setSelectedPayment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectPayment}
              disabled={processingAction || !rejectionNotes.trim()}
              variant="destructive"
            >
              {processingAction ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>View Receipt</DialogTitle>
          </DialogHeader>
          
          <div className="h-[60vh] overflow-auto">
            {viewingReceipt ? (
              <iframe 
                src={viewingReceipt} 
                className="w-full h-full border-0"
                title="Payment Receipt"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No receipt file available
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
            {viewingReceipt && (
              <Button
                onClick={() => {
                  window.open(viewingReceipt, '_blank');
                  setViewDialogOpen(false);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminReceipts;