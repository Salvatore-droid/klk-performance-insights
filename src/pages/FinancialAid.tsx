import React, { useState } from 'react';
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
  Cell
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
  ArrowUpRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FinancialAid = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { title: 'Total Disbursed', value: 'KES 12.4M', change: '+23.1%', icon: DollarSign, color: 'bg-green-500' },
    { title: 'Pending Payments', value: 'KES 2.8M', change: '42 requests', icon: Clock, color: 'bg-orange-500' },
    { title: 'Active Scholarships', value: '856', change: '+12 this month', icon: Users, color: 'bg-blue-500' },
    { title: 'Avg. Aid per Student', value: 'KES 14,500', change: '+8.4%', icon: CreditCard, color: 'bg-purple-500' },
  ];

  const monthlyDisbursement = [
    { month: 'Jan', amount: 1.2 },
    { month: 'Feb', amount: 1.5 },
    { month: 'Mar', amount: 1.8 },
    { month: 'Apr', amount: 2.1 },
    { month: 'May', amount: 2.4 },
    { month: 'Jun', amount: 2.8 },
  ];

  const aidDistribution = [
    { name: 'Tuition Fees', value: 45, color: '#4361ee' },
    { name: 'Books & Supplies', value: 20, color: '#4895ef' },
    { name: 'Transport', value: 15, color: '#4cc9f0' },
    { name: 'Uniforms', value: 12, color: '#f8961e' },
    { name: 'Other', value: 8, color: '#f72585' },
  ];

  const recentPayments = [
    { id: 1, student: 'Jane Muthoni', type: 'Tuition', amount: 'KES 45,000', status: 'Completed', date: '2024-03-10' },
    { id: 2, student: 'Kevin Ochieng', type: 'Books', amount: 'KES 8,500', status: 'Pending', date: '2024-03-09' },
    { id: 3, student: 'Grace Wanjiku', type: 'Tuition', amount: 'KES 52,000', status: 'Completed', date: '2024-03-08' },
    { id: 4, student: 'Michael Kimani', type: 'Transport', amount: 'KES 12,000', status: 'Processing', date: '2024-03-07' },
    { id: 5, student: 'Sarah Akinyi', type: 'Uniform', amount: 'KES 6,500', status: 'Completed', date: '2024-03-06' },
  ];

  const scholarshipApplications = [
    { id: 1, student: 'Peter Otieno', program: 'Full Scholarship', amount: 'KES 150,000', status: 'Under Review', submitted: '2024-03-08' },
    { id: 2, student: 'Mary Njeri', program: 'Partial Aid', amount: 'KES 75,000', status: 'Approved', submitted: '2024-03-05' },
    { id: 3, student: 'David Kiprop', program: 'Merit Scholarship', amount: 'KES 100,000', status: 'Under Review', submitted: '2024-03-04' },
    { id: 4, student: 'Lucy Wambui', program: 'Need-Based Aid', amount: 'KES 60,000', status: 'Rejected', submitted: '2024-03-01' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'Pending':
      case 'Under Review':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'Processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Financial Aid" subtitle="Manage scholarships, grants, and financial assistance programs">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h3>
              <p className="text-slate-600 text-sm">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Monthly Disbursement (in Millions KES)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyDisbursement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`KES ${value}M`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="#4361ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Aid Distribution by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={aidDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {aidDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-40 space-y-2">
                {aidDistribution.map((item, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-slate-600">{item.name}</span>
                    <span className="ml-auto font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
          <TabsTrigger value="applications">Scholarship Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Payments</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input 
                      placeholder="Search payments..." 
                      className="pl-10 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Payment
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8 mr-2">
                            <AvatarFallback>{payment.student.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          {payment.student}
                        </div>
                      </TableCell>
                      <TableCell>{payment.type}</TableCell>
                      <TableCell className="font-medium">{payment.amount}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-slate-500">{payment.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scholarship Applications</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Application
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Amount Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scholarshipApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8 mr-2">
                            <AvatarFallback>{app.student.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          {app.student}
                        </div>
                      </TableCell>
                      <TableCell>{app.program}</TableCell>
                      <TableCell className="font-medium">{app.amount}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-slate-500">{app.submitted}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default FinancialAid;
