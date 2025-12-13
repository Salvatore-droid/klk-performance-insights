import React, { useState } from 'react';
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
  Receipt, 
  Download, 
  Eye, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

const AdminReceipts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const receipts = [
    { id: 1, receiptNo: 'RCP-2024-001', student: 'Jane Muthoni', school: 'Moi Girls Secondary', date: '2024-01-15', amount: 30000, method: 'M-Pesa', term: 'Term 1 2024', status: 'verified' },
    { id: 2, receiptNo: 'RCP-2024-002', student: 'John Ochieng', school: 'Alliance High', date: '2024-01-18', amount: 45000, method: 'Bank Transfer', term: 'Term 1 2024', status: 'pending' },
    { id: 3, receiptNo: 'RCP-2024-003', student: 'Mary Wanjiru', school: 'Kenya High', date: '2024-01-20', amount: 38000, method: 'M-Pesa', term: 'Term 1 2024', status: 'verified' },
    { id: 4, receiptNo: 'RCP-2024-004', student: 'Peter Kamau', school: 'Starehe Boys', date: '2024-01-22', amount: 52000, method: 'Cash', term: 'Term 1 2024', status: 'pending' },
    { id: 5, receiptNo: 'RCP-2024-005', student: 'Grace Otieno', school: 'Precious Blood', date: '2024-01-25', amount: 35000, method: 'Bank Transfer', term: 'Term 1 2024', status: 'rejected' },
    { id: 6, receiptNo: 'RCP-2024-006', student: 'David Mwangi', school: 'Lenana School', date: '2024-01-26', amount: 48000, method: 'M-Pesa', term: 'Term 1 2024', status: 'verified' },
  ];

  const stats = [
    { title: 'Total Receipts', value: '156', icon: Receipt, color: 'bg-blue-500' },
    { title: 'Verified', value: '128', icon: CheckCircle, color: 'bg-emerald-500' },
    { title: 'Pending Review', value: '23', icon: Clock, color: 'bg-amber-500' },
    { title: 'Rejected', value: '5', icon: XCircle, color: 'bg-red-500' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleVerify = (id: number) => {
    toast.success('Receipt verified successfully');
  };

  const handleReject = (id: number) => {
    toast.error('Receipt rejected');
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          receipt.receiptNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="Receipts Management" subtitle="View and verify payment receipts">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
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

      {/* Filters */}
      <Card className="border-0 shadow-md mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by student name or receipt number..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            All Receipts ({filteredReceipts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.receiptNo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">{receipt.student.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {receipt.student}
                    </div>
                  </TableCell>
                  <TableCell>{receipt.school}</TableCell>
                  <TableCell className="font-medium">KES {receipt.amount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{receipt.method}</Badge></TableCell>
                  <TableCell>{receipt.term}</TableCell>
                  <TableCell>{receipt.date}</TableCell>
                  <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      {receipt.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => handleVerify(receipt.id)}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleReject(receipt.id)}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminReceipts;
