import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  GraduationCap
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Beneficiaries = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  const stats = [
    { title: 'Total Beneficiaries', value: '2,847', icon: Users, color: 'bg-blue-500' },
    { title: 'Active Students', value: '2,156', icon: UserCheck, color: 'bg-green-500' },
    { title: 'Inactive', value: '423', icon: UserX, color: 'bg-orange-500' },
    { title: 'Graduated', value: '268', icon: GraduationCap, color: 'bg-purple-500' },
  ];

  const beneficiaries = [
    { id: 1, name: 'Jane Muthoni', email: 'jane.m@email.com', level: 'Secondary', grade: 'Form 2', status: 'Active', performance: 96.8, joinDate: '2022-01-15' },
    { id: 2, name: 'Kevin Ochieng', email: 'kevin.o@email.com', level: 'Primary', grade: 'Grade 8', status: 'Active', performance: 94.5, joinDate: '2021-09-01' },
    { id: 3, name: 'Grace Wanjiku', email: 'grace.w@email.com', level: 'Secondary', grade: 'Form 4', status: 'Active', performance: 93.7, joinDate: '2020-01-10' },
    { id: 4, name: 'Michael Kimani', email: 'michael.k@email.com', level: 'Primary', grade: 'Grade 7', status: 'Active', performance: 92.3, joinDate: '2021-01-20' },
    { id: 5, name: 'Sarah Akinyi', email: 'sarah.a@email.com', level: 'Secondary', grade: 'Form 3', status: 'Active', performance: 91.8, joinDate: '2021-05-12' },
    { id: 6, name: 'David Kiprop', email: 'david.k@email.com', level: 'University', grade: 'Year 2', status: 'Active', performance: 88.4, joinDate: '2022-09-01' },
    { id: 7, name: 'Mary Njeri', email: 'mary.n@email.com', level: 'Vocational', grade: 'Level 3', status: 'Inactive', performance: 76.2, joinDate: '2020-06-15' },
    { id: 8, name: 'Peter Otieno', email: 'peter.o@email.com', level: 'Pre-School', grade: 'PP2', status: 'Active', performance: 85.0, joinDate: '2023-01-08' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'Inactive':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Inactive</Badge>;
      case 'Graduated':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Graduated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{score}%</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{score}%</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{score}%</Badge>;
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{score}%</Badge>;
  };

  return (
    <DashboardLayout title="Beneficiaries" subtitle="Manage and track all program beneficiaries">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              All Beneficiaries
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search beneficiaries..." 
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="pre-school">Pre-School</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="vocational">Vocational</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Beneficiary
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Education Level</TableHead>
                <TableHead>Grade/Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficiaries.map((beneficiary) => (
                <TableRow key={beneficiary.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="w-10 h-10 mr-3">
                        <AvatarImage src={`/api/placeholder/40/40`} />
                        <AvatarFallback>{beneficiary.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">{beneficiary.name}</p>
                        <p className="text-sm text-slate-500">{beneficiary.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{beneficiary.level}</TableCell>
                  <TableCell>{beneficiary.grade}</TableCell>
                  <TableCell>{getStatusBadge(beneficiary.status)}</TableCell>
                  <TableCell>{getPerformanceBadge(beneficiary.performance)}</TableCell>
                  <TableCell className="text-slate-500">{beneficiary.joinDate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default Beneficiaries;
