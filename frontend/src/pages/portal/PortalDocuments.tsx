import React, { useState, useEffect } from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
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
import { 
  FileText, 
  Download, 
  Eye, 
  Search,
  Filter,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Document {
  id: number;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'requires_action';
  uploaded_at: string;
  file_url: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  size?: string;
}

const PortalDocuments = () => {
  const { apiRequest } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<{value: string; label: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_previous: false,
  });

  // Fetch document types
  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  // Fetch documents
  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, typeFilter]);

  const fetchDocumentTypes = async () => {
    try {
      setLoadingTypes(true);
      const { data, error } = await apiRequest('/documents/types/');
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success && data.document_types) {
        setDocumentTypes(data.document_types);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load document types',
        variant: 'destructive',
      });
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchDocuments = async (page = 1, search = '') => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(search && { search }),
      });
      
      const { data, error } = await apiRequest(`/documents/?${params}`);
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        setDocuments(data.documents || []);
        setPagination(data.pagination || {
          current_page: 1,
          total_pages: 1,
          total_count: 0,
          has_next: false,
          has_previous: false,
        });
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDocuments(1, searchTerm);
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      const { data, error } = await apiRequest(`/documents/${documentId}/delete/`, {
        method: 'DELETE',
      });
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Document deleted successfully',
        });
        // Refresh documents list
        fetchDocuments(pagination.current_page, searchTerm);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      // Create a temporary link to trigger download
      const response = await fetch(`/api/documents/${documentId}/download/`, {
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
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
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
      case 'requires_action':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Action Required
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (typeValue: string) => {
    const type = documentTypes.find(t => t.value === typeValue);
    return type ? type.label : typeValue;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return XCircle;
      case 'requires_action': return AlertCircle;
      default: return FileText;
    }
  };

  return (
    <BeneficiaryLayout title="My Documents" subtitle="View and manage your submitted documents">
      {/* Upload Button */}
      <div className="flex justify-end mb-6">
        <Link to="/portal/upload">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload New Document
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search documents..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="requires_action">Action Required</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter} disabled={loadingTypes}>
              <SelectTrigger className="w-full md:w-48">
                {loadingTypes ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Loading types...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Filter by type" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            All Documents ({pagination.total_count})
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
                <p className="text-slate-600">Loading documents...</p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FileText className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-600 mb-2">No documents found</p>
              <p className="text-sm text-slate-500 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Upload your first document to get started'}
              </p>
              <Link to="/portal/upload">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Review Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => {
                    const StatusIcon = getStatusIcon(doc.status);
                    return (
                      <TableRow key={doc.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTypeLabel(doc.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(doc.uploaded_at)}</span>
                            {doc.reviewed_at && (
                              <span className="text-xs text-slate-500">
                                Reviewed: {formatDate(doc.reviewed_at)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${
                              doc.status === 'approved' ? 'text-emerald-600' :
                              doc.status === 'pending' ? 'text-amber-600' :
                              'text-red-600'
                            }`} />
                            {getStatusBadge(doc.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.reviewer_notes ? (
                            <div className="max-w-xs">
                              <p className="text-sm text-slate-700 truncate">
                                {doc.reviewer_notes}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {doc.file_url && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownload(doc.id, doc.name)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            {doc.status === 'pending' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{doc.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
                    Showing {documents.length} of {pagination.total_count} documents
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchDocuments(pagination.current_page - 1, searchTerm)}
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
                            onClick={() => fetchDocuments(pageNum, searchTerm)}
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
                      onClick={() => fetchDocuments(pagination.current_page + 1, searchTerm)}
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

      {/* Status Legend */}
      <Card className="border-0 shadow-md mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-700">
            Status Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm">Approved - Document has been reviewed and approved</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm">Pending - Awaiting review by administrator</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm">Rejected - Document was not accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm">Action Required - Needs correction/resubmission</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </BeneficiaryLayout>
  );
};

export default PortalDocuments;