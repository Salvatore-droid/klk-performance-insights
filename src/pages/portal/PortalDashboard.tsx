import React from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PortalDashboard = () => {
  const stats = [
    { title: 'Documents Submitted', value: '12', icon: FileText, color: 'bg-blue-500' },
    { title: 'Pending Approval', value: '3', icon: Clock, color: 'bg-amber-500' },
    { title: 'Approved', value: '8', icon: CheckCircle, color: 'bg-emerald-500' },
    { title: 'Action Required', value: '1', icon: AlertCircle, color: 'bg-red-500' },
  ];

  const recentDocuments = [
    { name: 'Term 1 Fee Statement 2024', status: 'approved', date: '2024-01-15' },
    { name: 'School Receipt - Jan 2024', status: 'pending', date: '2024-01-20' },
    { name: 'Report Card Term 3 2023', status: 'approved', date: '2023-12-10' },
    { name: 'Medical Certificate', status: 'rejected', date: '2024-01-18' },
  ];

  const upcomingDeadlines = [
    { title: 'Term 2 Fee Statement Due', date: '2024-02-15', daysLeft: 5 },
    { title: 'Report Card Submission', date: '2024-02-20', daysLeft: 10 },
    { title: 'Annual Medical Checkup', date: '2024-03-01', daysLeft: 19 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <BeneficiaryLayout title="My Dashboard" subtitle="Welcome back, Jane Muthoni">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Link to="/portal/upload">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </Link>
        <Link to="/portal/messages">
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Documents</CardTitle>
            <Link to="/portal/documents">
              <Button variant="ghost" size="sm" className="text-emerald-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{doc.name}</p>
                      <p className="text-sm text-slate-500">{doc.date}</p>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">{deadline.title}</p>
                  <p className="text-sm text-slate-500">{deadline.date}</p>
                  <Badge 
                    className={`mt-2 ${
                      deadline.daysLeft <= 7 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {deadline.daysLeft} days left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Performance Summary */}
      <Card className="mt-6 border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Academic Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Current GPA</p>
              <p className="text-3xl font-bold text-emerald-600">3.75</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Class Rank</p>
              <p className="text-3xl font-bold text-blue-600">5/45</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Attendance</p>
              <p className="text-3xl font-bold text-amber-600">96%</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Financial Aid Status</p>
              <Badge className="mt-2 bg-emerald-100 text-emerald-700 text-lg px-4 py-1">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </BeneficiaryLayout>
  );
};

export default PortalDashboard;
