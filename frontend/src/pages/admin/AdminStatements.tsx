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
  FileText, 
  Download, 
  Eye, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const AdminStatements = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');

  const statements = [
    { id: 1, student: 'Jane Muthoni', school: 'Moi Girls Secondary', term: 'Term 1 2024', totalFees: 45000, amountPaid: 30000, balance: 15000, dueDate: '2024-02-15', status: 'partial' },
    { id: 2, student: 'John Ochieng', school: 'Alliance High', term: 'Term 1 2024', totalFees: 65000, amountPaid: 65000, balance: 0, dueDate: '2024-02-15', status: 'paid' },
    { id: 3, student: 'Mary Wanjiru', school: 'Kenya High', term: 'Term 1 2024', totalFees: 48000, amountPaid: 48000, balance: 0, dueDate: '2024-02-15', status: 'paid' },
    { id: 4, student: 'Peter Kamau', school: 'Starehe Boys', term: 'Term 1 2024', totalFees: 72000, amountPaid: 0, balance: 72000, dueDate: '2024-02-15', status: 'unpaid' },
    { id: 5, student: 'Grace Otieno', school: 'Precious Blood', term: 'Term 1 2024', totalFees: 42000, amountPaid: 20000, balance: 22000, dueDate: '2024-02-15', status: 'partial' },
    { id: 6, student: 'David Mwangi', school: 'Lenana School', term: 'Term 1 2024', totalFees: 58000, amountPaid: 58000, balance: 0, dueDate: '2024-02-15', status: 'paid' },
  ];

  const stats = [
    { title: 'Total Expected', value: 'KES 2.4M', icon: DollarSign, color: 'bg-blue-500' },
    { title: 'Total Collected', value: 'KES 1.9M', icon: TrendingUp, color: 'bg-emerald-500' },
    { title: 'Outstanding', value: 'KES 520K', icon: AlertTriangle, color: 'bg-amber-500' },
    { title: 'Collection Rate', value: '79%', icon: CheckCircle, color: 'bg-purple-500' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Fully Paid</Badge>;
      case 'partial':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Partial</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredStatements = statements.filter(statement => {
    const matchesSearch = statement.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          statement.school.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || statement.status === statusFilter;
    const matchesTerm = termFilter === 'all' || statement.term === termFilter;
    return matchesSearch && matchesStatus && matchesTerm;
  });

  return (
    <DashboardLayout title="Fee Statements" subtitle="Track and manage student fee statements">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
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
                placeholder="Search by student name or school..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={termFilter} onValueChange={setTermFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="Term 1 2024">Term 1 2024</SelectItem>
                <SelectItem value="Term 3 2023">Term 3 2023</SelectItem>
                <SelectItem value="Term 2 2023">Term 2 2023</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Fully Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statements Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Fee Statements ({filteredStatements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Total Fees</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStatements.map((statement) => (
                <TableRow key={statement.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">{statement.student.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {statement.student}
                    </div>
                  </TableCell>
                  <TableCell>{statement.school}</TableCell>
                  <TableCell>{statement.term}</TableCell>
                  <TableCell className="font-medium">KES {statement.totalFees.toLocaleString()}</TableCell>
                  <TableCell className="text-emerald-600">KES {statement.amountPaid.toLocaleString()}</TableCell>
                  <TableCell className={statement.balance > 0 ? 'text-red-600 font-medium' : 'text-emerald-600'}>
                    KES {statement.balance.toLocaleString()}
                  </TableCell>
                  <TableCell>{statement.dueDate}</TableCell>
                  <TableCell>{getStatusBadge(statement.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Overdue Balances Alert */}
      <Card className="border-0 shadow-md mt-6 bg-red-50 border-l-4 border-l-red-500">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Overdue Balances Alert</h3>
              <p className="text-red-700 mt-1">
                <strong>3 students</strong> have overdue fee balances totaling <strong>KES 109,000</strong>. 
                Please review and follow up with respective guardians.
              </p>
              <Button className="mt-3 bg-red-600 hover:bg-red-700">
                View Overdue Accounts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminStatements;
