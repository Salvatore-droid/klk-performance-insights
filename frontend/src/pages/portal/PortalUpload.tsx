import React, { useState, useEffect } from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileUp,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DocumentType {
  value: string;
  label: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const PortalUpload = () => {
  const { apiRequest, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    document_type: '',
    description: '',
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch document types on mount
  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchDocumentTypes = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (10MB max)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > MAX_SIZE) {
        toast({
          title: 'File too large',
          description: `Maximum file size is ${MAX_SIZE / (1024 * 1024)}MB`,
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 
                           'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension)) {
        toast({
          title: 'Invalid file type',
          description: 'Allowed types: PDF, JPG, PNG, DOC, DOCX',
          variant: 'destructive',
        });
        return;
      }
      
      // Set file and generate preview for images
      setFile(selectedFile);
      setErrors(prev => ({ ...prev, file: '' }));
      
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
      
      // Auto-fill name if empty
      if (!formData.name) {
        const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({
          ...prev,
          name: fileNameWithoutExt
        }));
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Document name is required';
    }
    
    if (!formData.document_type) {
      newErrors.document_type = 'Document type is required';
    }
    
    if (!file) {
      newErrors.file = 'Please select a file to upload';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields correctly',
        variant: 'destructive',
      });
      return;
    }
    
    if (!token) {
      toast({
        title: 'Authentication Error',
        description: 'Please login again',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress({ loaded: 0, total: file?.size || 0, percentage: 0 });
      
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('document_type', formData.document_type);
      if (formData.description) {
        formDataObj.append('description', formData.description);
      }
      if (file) {
        formDataObj.append('file', file);
      }
      
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          setUploadProgress({
            loaded: event.loaded,
            total: event.total,
            percentage
          });
        }
      });
      
      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', 'http://localhost:8000/api/documents/upload/');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || 'Upload failed'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error'));
        };
        
        xhr.send(formDataObj);
      });
      
      const data = response as any;
      
      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Document uploaded successfully',
        });
        
        // Reset form
        setFormData({
          name: '',
          document_type: '',
          description: '',
        });
        setFile(null);
        setPreviewUrl(null);
        setErrors({});
        setUploadProgress(null);
        
        // Redirect to documents page
        setTimeout(() => {
          navigate('/portal/documents');
        }, 1500);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error?.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      case 'doc':
      case 'docx':
        return '📝';
      default:
        return '📎';
    }
  };

  if (loading) {
    return (
      <BeneficiaryLayout title="Upload Document" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-slate-600">Loading document types...</p>
          </div>
        </div>
      </BeneficiaryLayout>
    );
  }

  return (
    <BeneficiaryLayout 
      title="Upload Document" 
      subtitle="Submit documents for administrative review"
    >
      <div className="max-w-3xl mx-auto">
        {/* Main Upload Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Upload className="w-6 h-6 text-emerald-600" />
                  Upload New Document
                </CardTitle>
                <CardDescription>
                  Upload documents for review. Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                </CardDescription>
              </div>
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Document Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  Document Name *
                  {errors.name && <span className="text-red-500 text-sm">({errors.name})</span>}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g., Term 1 Fee Statement 2024"
                  className={errors.name ? 'border-red-500' : ''}
                  disabled={uploading}
                />
                <p className="text-xs text-slate-500">
                  Give your document a descriptive name for easy identification
                </p>
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <Label htmlFor="document_type" className="flex items-center gap-2">
                  Document Type *
                  {errors.document_type && <span className="text-red-500 text-sm">({errors.document_type})</span>}
                </Label>
                <Select 
                  value={formData.document_type} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, document_type: value }));
                    setErrors(prev => ({ ...prev, document_type: '' }));
                  }}
                  disabled={uploading}
                >
                  <SelectTrigger className={errors.document_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Choose the appropriate category for your document
                </p>
              </div>

              {/* File Upload Area */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Upload File *
                  {errors.file && <span className="text-red-500 text-sm">({errors.file})</span>}
                </Label>
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  errors.file 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-slate-200 hover:border-emerald-400'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !uploading && document.getElementById('file-upload')?.click()}
                >
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={uploading}
                  />
                  
                  {file ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-3xl">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-slate-700">{file.name}</p>
                          <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      {!uploading && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile();
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove File
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-emerald-50 rounded-full inline-flex">
                        <Upload className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">
                          {uploading ? 'Upload in progress...' : 'Click to browse or drag and drop'}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Max file size: 10MB • Supported: PDF, JPG, PNG, DOC, DOCX
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* File Preview */}
                {previewUrl && (
                  <div className="mt-4">
                    <Label>Preview:</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-48 w-auto mx-auto object-contain"
                      />
                    </div>
                  </div>
                )}
                
                {/* Upload Progress */}
                {uploading && uploadProgress && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Uploading...</span>
                      <span className="font-medium text-emerald-600">
                        {uploadProgress.percentage}%
                      </span>
                    </div>
                    <Progress value={uploadProgress.percentage} className="h-2" />
                    <p className="text-xs text-slate-500 text-center">
                      {formatFileSize(uploadProgress.loaded)} of {formatFileSize(uploadProgress.total)}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Additional Notes (Optional)</Label>
                <Textarea 
                  id="description"
                  placeholder="Add any context, notes, or special instructions for the reviewer..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  disabled={uploading}
                />
                <p className="text-xs text-slate-500">
                  Helpful for reviewers to understand your document better
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={uploading}
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileUp className="w-5 h-5 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/portal/documents')}
                  disabled={uploading}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Upload Guidelines */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-600" />
              Upload Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Alert className="bg-emerald-50 border-emerald-200">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">
                  <strong>Clear Documents:</strong> Ensure all text is legible and images are clear
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  <strong>Complete Information:</strong> Fee statements must include school stamp and dates
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-amber-50 border-amber-200">
                <CheckCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  <strong>Valid Receipts:</strong> Receipts should show payment amount, date, and purpose
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-purple-50 border-purple-200">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-700">
                  <strong>Review Timeline:</strong> Documents are typically reviewed within 3-5 business days
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-700 mb-2">What happens after upload?</h4>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-600">
                <li>Document is queued for review by an administrator</li>
                <li>You'll receive email notifications about status updates</li>
                <li>Check your dashboard for approval status</li>
                <li>If action is required, you'll see notes from the reviewer</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert className="mt-6 bg-slate-50 border-slate-200">
          <Shield className="h-4 w-4 text-slate-600" />
          <AlertDescription className="text-slate-600 text-sm">
            <strong>Security Notice:</strong> Your documents are encrypted during upload and stored securely. 
            Only authorized administrators can access submitted documents for review purposes.
          </AlertDescription>
        </Alert>
      </div>
    </BeneficiaryLayout>
  );
};

export default PortalUpload;