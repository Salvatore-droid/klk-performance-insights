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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  School,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FeeStatement {
  id: number;
  term: string;
  year: number;
  school: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
  due_date: string;
  status: 'pending' | 'approved' | 'paid' | 'partial' | 'unpaid' | 'overdue';
  payment_percentage: number;
  statement_file: string | null;
  notes: string | null;
  created_at: string;
}

interface SummaryStats {
  total_fees: string;
  total_paid: string;
  total_balance: string;
  payment_percentage: number;
  fees_change: number;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_previous: boolean;
}

interface OutstandingStatement {
  id: number;
  term: string;
  year: number;
  balance: string;
  due_date: string;
  days_overdue: number;
}

const PortalStatements = () => {
  const { apiRequest } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [loadingYears, setLoadingYears] = useState(false);
  const [statements, setStatements] = useState<FeeStatement[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_previous: false,
  });
  const [outstandingStatements, setOutstandingStatements] = useState<OutstandingStatement[]>([]);
  const [years, setYears] = useState<number[]>([]);
  
  const [filters, setFilters] = useState({
    year: 'all',
    status: 'all',
  });

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    fetchStatements();
    fetchSummary();
  }, [filters.year, filters.status]);

  const fetchYears = async () => {
    try {
      setLoadingYears(true);
      const { data, error } = await apiRequest('/statements/years/');
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        setYears(data.years || []);
      }
    } catch (error) {
      console.error('Error fetching years:', error);
    } finally {
      setLoadingYears(false);
    }
  };

  const fetchStatements = async (page = 1) => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.year !== 'all' && { year: filters.year }),
        ...(filters.status !== 'all' && { status: filters.status }),
      });
      
      const { data, error } = await apiRequest(`/statements/?${params}`);
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        setStatements(data.statements || []);
        setPagination(data.pagination || {
          current_page: 1,
          total_pages: 1,
          total_count: 0,
          has_next: false,
          has_previous: false,
        });
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fee statements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data, error } = await apiRequest('/statements/summary/');
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        setSummaryStats(data.summary_stats || null);
        setOutstandingStatements(data.outstanding_statements || []);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleDownload = async (statementId: number, fileName: string) => {
    try {
      // Create a temporary link to trigger download
      const response = await fetch(`/api/statements/${statementId}/download/`, {
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
        description: 'Failed to download statement',
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Fully Paid
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Partial Payment
          </Badge>
        );
      case 'unpaid':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Unpaid
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Overdue
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const summaryStatsData = [
    { 
      title: 'Total Fees (Current Year)', 
      value: summaryStats ? formatCurrency(summaryStats.total_fees) : 'KES 0', 
      icon: DollarSign, 
      color: 'bg-blue-500',
      change: summaryStats ? `${summaryStats.fees_change > 0 ? '+' : ''}${summaryStats.fees_change.toFixed(1)}%` : '0%'
    },
    { 
      title: 'Amount Paid', 
      value: summaryStats ? formatCurrency(summaryStats.total_paid) : 'KES 0', 
      icon: TrendingUp, 
      color: 'bg-emerald-500',
      change: summaryStats ? `${summaryStats.payment_percentage.toFixed(1)}% paid` : '0%'
    },
    { 
      title: 'Outstanding Balance', 
      value: summaryStats ? formatCurrency(summaryStats.total_balance) : 'KES 0', 
      icon: TrendingDown, 
      color: 'bg-amber-500',
      change: summaryStats ? `${((summaryStats.total_balance === '0.00' || parseFloat(summaryStats.total_fees) === 0) ? 0 : (parseFloat(summaryStats.total_balance) / parseFloat(summaryStats.total_fees) * 100)).toFixed(1)}%` : '0%'
    },
  ];

  return (
    <BeneficiaryLayout title="Fee Statements" subtitle="View and manage your fee statements">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {summaryStatsData.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.title.includes('Outstanding') ? 'text-amber-600' :
                    stat.title.includes('Amount Paid') ? 'text-emerald-600' :
                    'text-blue-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select 
                value={filters.year} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}
                disabled={loadingYears}
              >
                <SelectTrigger>
                  {loadingYears ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading years...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Filter by year" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Fully Paid</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Link to="/portal/upload" className="md:self-end">
              <Button className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto">
                <Upload className="w-4 h-4 mr-2" />
                Upload Fee Statement
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Statements Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Fee Statements History ({pagination.total_count})
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
                <p className="text-slate-600">Loading fee statements...</p>
              </div>
            </div>
          ) : statements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Receipt className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-600 mb-2">No fee statements found</p>
              <p className="text-sm text-slate-500 mb-4">
                {filters.year !== 'all' || filters.status !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Upload your first fee statement to get started'}
              </p>
              <Link to="/portal/upload">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Statement
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term / Year</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Payment Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((statement) => (
                    <TableRow key={statement.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{statement.term}</span>
                          <span className="text-sm text-slate-500">{statement.year}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <School className="w-4 h-4 text-slate-400" />
                          <span className="max-w-xs truncate">{statement.school}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(statement.total_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatCurrency(statement.amount_paid)}</span>
                          <span className="text-xs text-slate-500">
                            {statement.payment_percentage.toFixed(1)}% paid
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={parseFloat(statement.balance) > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600'}>
                        {formatCurrency(statement.balance)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(statement.due_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <Progress 
                            value={statement.payment_percentage} 
                            className={`h-2 ${
                              statement.payment_percentage >= 100 ? 'bg-emerald-500' :
                              statement.payment_percentage >= 50 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(statement.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {statement.statement_file && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownload(statement.id, `statement_${statement.term}_${statement.year}.pdf`)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          {statement.notes && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: 'Statement Notes',
                                  description: statement.notes,
                                });
                              }}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-slate-500">
                    Showing {statements.length} of {pagination.total_count} statements
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchStatements(pagination.current_page - 1)}
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
                            onClick={() => fetchStatements(pageNum)}
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
                      onClick={() => fetchStatements(pagination.current_page + 1)}
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

      {/* Outstanding Balance Notice */}
      {outstandingStatements.length > 0 && (
        <Card className="border-0 shadow-md mt-6 bg-amber-50 border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 text-lg">Outstanding Balance Notice</h3>
                <p className="text-amber-700 mt-1">
                  You have {outstandingStatements.length} outstanding fee statement{
                    outstandingStatements.length > 1 ? 's' : ''
                  } with a total balance of <strong>{summaryStats ? formatCurrency(summaryStats.total_balance) : 'KES 0'}</strong>.
                </p>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {outstandingStatements.map((stmt) => (
                    <div key={stmt.id} className="bg-white p-3 rounded-lg border border-amber-200">
                      <p className="font-medium text-amber-800">{stmt.term} {stmt.year}</p>
                      <p className="text-sm text-amber-700">Balance: {formatCurrency(stmt.balance)}</p>
                      <p className="text-xs text-amber-600 mt-1">
                        Due: {formatDate(stmt.due_date)}
                        {stmt.days_overdue > 0 && (
                          <span className="ml-2 text-red-600">
                            ({stmt.days_overdue} day{stmt.days_overdue > 1 ? 's' : ''} overdue)
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <FileText className="w-4 h-4 mr-2" />
                    View Payment Instructions
                  </Button>
                  <Button variant="outline" className="ml-3 border-amber-600 text-amber-600 hover:bg-amber-50">
                    Contact Financial Aid Office
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Status Legend */}
      <Card className="border-0 shadow-md mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-700">
            Payment Status Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm">Fully Paid - All fees have been cleared</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm">Partial - Partial payment made, balance remains</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm">Unpaid - No payment received</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm">Overdue - Payment past due date</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </BeneficiaryLayout>
  );
};

export default PortalStatements;
