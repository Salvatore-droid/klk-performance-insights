import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  FileText, 
  Download, 
  Eye, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  School,
  User,
  RefreshCw,
  BarChart3,
  Percent,
  FileDown,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FeeStatement {
  id: number;
  user_id: number;
  term: string;
  year: number;
  school: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
  due_date: string;
  status: string;
  payment_percentage: number;
  statement_file: string | null;
  notes: string | null;
  created_at: string;
  student_name?: string;
  student_email?: string;
  days_overdue?: number;
}

interface StatementStats {
  total_fees: string;
  total_paid: string;
  total_balance: string;
  payment_percentage: number;
  fees_change: number;
}

const AdminStatements = () => {
  const { apiRequest } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statements, setStatements] = useState<FeeStatement[]>([]);
  const [stats, setStats] = useState<StatementStats>({
    total_fees: '0',
    total_paid: '0',
    total_balance: '0',
    payment_percentage: 0,
    fees_change: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [years, setYears] = useState<number[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<FeeStatement | null>(null);
  const [notes, setNotes] = useState('');

  // Fetch fee statements
  const fetchStatements = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(yearFilter !== 'all' && { year: yearFilter }),
      });

      const { data, error } = await apiRequest(`/admin/fee-statements/?${params}`);
      
      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        setStatements(data.statements || []);
        setTotalCount(data.pagination?.total_count || 0);
        setTerms(Array.from(new Set(data.statements?.map((s: FeeStatement) => s.term).filter(Boolean) || [])));
      }
    } catch (error) {
      console.error('Error fetching fee statements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fee statements.',
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
      
      const { data, error } = await apiRequest('/admin/statement-summary/');
      
      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        setStats(data.summary_stats || {
          total_fees: '0',
          total_paid: '0',
          total_balance: '0',
          payment_percentage: 0,
          fees_change: 0
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch available years
  const fetchYears = async () => {
    try {
      const { data, error } = await apiRequest('/admin/fee-statements/years/');
      
      if (!error && data?.success) {
        setYears(data.years || []);
      }
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  useEffect(() => {
    fetchStatements();
    fetchStatistics();
    fetchYears();
  }, [currentPage, itemsPerPage, statusFilter, yearFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchStatements();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDownloadStatement = async (statementId: number, fileName: string) => {
    try {
      const { data, error } = await apiRequest(`/admin/fee-statements/${statementId}/download/`);
      
      if (error) {
        throw new Error(error);
      }

      // Create a blob from the response and trigger download
      if (data instanceof Blob) {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || `statement_${statementId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'Statement downloaded successfully.',
        });
      }
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast({
        title: 'Error',
        description: 'Failed to download statement.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatement = async () => {
    if (!selectedStatement) return;

    try {
      const { data, error } = await apiRequest(`/admin/fee-statements/${selectedStatement.id}/update/`, {
        method: 'POST',
        body: JSON.stringify({ notes })
      });

      if (error) throw new Error(error);

      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Statement updated successfully.',
        });
        setDialogOpen(false);
        setNotes('');
        setSelectedStatement(null);
        fetchStatements();
      }
    } catch (error) {
      console.error('Error updating statement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update statement.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Fully Paid</Badge>;
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Partial Payment</Badge>;
      case 'unpaid':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Unpaid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const calculateOverdueTotal = () => {
    return statements
      .filter(s => s.status === 'overdue' || getDaysOverdue(s.due_date) > 0)
      .reduce((total, s) => total + parseFloat(s.balance), 0);
  };

  const calculateOverdueCount = () => {
    return statements.filter(s => s.status === 'overdue' || getDaysOverdue(s.due_date) > 0).length;
  };

  const filteredStatements = statements.filter(statement => {
    const matchesTerm = termFilter === 'all' || statement.term === termFilter;
    return matchesTerm;
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const statsCards = [
    { 
      title: 'Total Expected', 
      value: formatCurrency(stats.total_fees), 
      icon: DollarSign, 
      color: 'bg-blue-500',
      loading: loadingStats
    },
    { 
      title: 'Total Collected', 
      value: formatCurrency(stats.total_paid), 
      icon: TrendingUp, 
      color: 'bg-green-500',
      loading: loadingStats
    },
    { 
      title: 'Outstanding', 
      value: formatCurrency(stats.total_balance), 
      icon: AlertTriangle, 
      color: 'bg-amber-500',
      loading: loadingStats
    },
    { 
      title: 'Collection Rate', 
      value: `${stats.payment_percentage.toFixed(1)}%`, 
      icon: Percent, 
      color: 'bg-purple-500',
      loading: loadingStats
    },
  ];

  return (
    <DashboardLayout title="Fee Statements" subtitle="Track and manage student fee statements">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
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
              {index === 3 && stats.fees_change !== 0 && (
                <div className={`flex items-center mt-2 text-sm ${stats.fees_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.fees_change > 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingUp className="w-4 h-4 mr-1 transform rotate-180" />
                  )}
                  {Math.abs(stats.fees_change).toFixed(1)}% from last year
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by student name or school..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {terms.length > 0 && (
              <Select value={termFilter} onValueChange={setTermFilter}>
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue placeholder="Filter by term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map(term => (
                    <SelectItem key={term} value={term}>{term}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Fully Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => { 
                setSearchTerm(''); 
                setStatusFilter('all'); 
                setTermFilter('all'); 
                setYearFilter('all'); 
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
            
            <Button onClick={fetchStatements} variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statements Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Fee Statements ({totalCount})
            </CardTitle>
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
              <Button variant="outline">
                <FileDown className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredStatements.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No fee statements found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm || statusFilter !== 'all' || yearFilter !== 'all' 
                  ? 'Try changing your search filters' 
                  : 'No fee statements available'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>School & Term</TableHead>
                      <TableHead className="text-right">Total Fees</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStatements.map((statement, index) => {
                      const daysOverdue = getDaysOverdue(statement.due_date);
                      const isOverdue = daysOverdue > 0;
                      
                      return (
                        <TableRow key={statement.id} className={isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}>
                          <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarFallback className="text-xs">
                                  {statement.student_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 truncate">{statement.student_name || 'Unknown Student'}</p>
                                <p className="text-xs text-slate-500 truncate">{statement.student_email || ''}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-slate-900">
                                <School className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{statement.school}</span>
                              </div>
                              <div className="flex items-center text-xs text-slate-500">
                                <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span>{statement.term} {statement.year}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(statement.total_amount)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(statement.amount_paid)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${parseFloat(statement.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(statement.balance)}
                            {statement.payment_percentage > 0 && (
                              <div className="text-xs text-slate-500 mt-1">
                                {statement.payment_percentage.toFixed(1)}% paid
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm text-slate-900">
                                {formatDate(statement.due_date)}
                              </div>
                              {isOverdue && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(statement.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedStatement(statement);
                                  setNotes(statement.notes || '');
                                  setDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {statement.statement_file && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadStatement(statement.id, `${statement.term}_${statement.year}.pdf`)}
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
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} statements
                </div>
                <div className="flex items-center gap-2">
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

      {/* Overdue Balances Alert */}
      {calculateOverdueCount() > 0 && (
        <Card className="mt-6 bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Overdue Balances Alert</h3>
                <p className="text-red-700 mt-1">
                  <strong>{calculateOverdueCount()} students</strong> have overdue fee balances totaling{' '}
                  <strong>{formatCurrency(calculateOverdueTotal().toString())}</strong>.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button className="bg-red-600 hover:bg-red-700">
                    View Overdue Accounts
                  </Button>
                  <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                    Send Reminders
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statement Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Fee Statement Details</DialogTitle>
            <DialogDescription>
              View and update fee statement information
            </DialogDescription>
          </DialogHeader>
          
          {selectedStatement && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 text-sm">Student</Label>
                  <p className="font-medium">{selectedStatement.student_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Term</Label>
                  <p className="font-medium">{selectedStatement.term} {selectedStatement.year}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">School</Label>
                  <p className="font-medium">{selectedStatement.school}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Due Date</Label>
                  <p className="font-medium">{formatDate(selectedStatement.due_date)}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Financial Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-500 text-sm">Total Fees</Label>
                    <p className="text-lg font-bold">{formatCurrency(selectedStatement.total_amount)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-sm">Amount Paid</Label>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(selectedStatement.amount_paid)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-sm">Balance</Label>
                    <p className={`text-lg font-bold ${parseFloat(selectedStatement.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(selectedStatement.balance)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                    <span>Payment Progress</span>
                    <span>{selectedStatement.payment_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(selectedStatement.payment_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="notes">Administrative Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this fee statement..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  These notes are for administrative purposes only and will not be visible to the beneficiary.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-3">
            {selectedStatement?.statement_file && (
              <Button 
                variant="outline"
                onClick={() => handleDownloadStatement(selectedStatement.id, `${selectedStatement.term}_${selectedStatement.year}.pdf`)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Statement
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setNotes('');
                setSelectedStatement(null);
              }}
            >
              Close
            </Button>
            <Button onClick={handleUpdateStatement}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminStatements;