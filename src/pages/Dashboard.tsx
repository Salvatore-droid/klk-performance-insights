import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
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
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Bell,
  CheckCircle2
} from 'lucide-react';

const Dashboard = () => {
  const statsCards = [
    { 
      title: 'Total Beneficiaries', 
      value: '2,847', 
      change: '+12.5%', 
      trend: 'up',
      icon: Users,
      color: 'bg-blue-500'
    },
    { 
      title: 'Active Students', 
      value: '2,156', 
      change: '+8.2%', 
      trend: 'up',
      icon: GraduationCap,
      color: 'bg-green-500'
    },
    { 
      title: 'Total Aid Disbursed', 
      value: 'KES 12.4M', 
      change: '+23.1%', 
      trend: 'up',
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    { 
      title: 'Avg. Performance', 
      value: '78.5%', 
      change: '+3.2%', 
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-orange-500'
    },
  ];

  const enrollmentData = [
    { month: 'Jan', students: 180 },
    { month: 'Feb', students: 220 },
    { month: 'Mar', students: 280 },
    { month: 'Apr', students: 320 },
    { month: 'May', students: 380 },
    { month: 'Jun', students: 420 },
  ];

  const levelDistribution = [
    { name: 'Pre-School', value: 320, color: '#4361ee' },
    { name: 'Primary', value: 890, color: '#4895ef' },
    { name: 'Secondary', value: 654, color: '#4cc9f0' },
    { name: 'University', value: 423, color: '#f8961e' },
    { name: 'Vocational', value: 560, color: '#f72585' },
  ];

  const recentActivities = [
    { id: 1, action: 'New student enrolled', name: 'Mary Wanjiku', time: '2 hours ago', type: 'enrollment' },
    { id: 2, action: 'Fee payment received', name: 'John Ochieng', time: '4 hours ago', type: 'payment' },
    { id: 3, action: 'Performance report submitted', name: 'Grace Muthoni', time: '5 hours ago', type: 'report' },
    { id: 4, action: 'Scholarship approved', name: 'Kevin Kamau', time: '1 day ago', type: 'approval' },
    { id: 5, action: 'New student enrolled', name: 'Sarah Akinyi', time: '1 day ago', type: 'enrollment' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Term 1 Examinations', date: 'Mar 15-22, 2024', type: 'exam' },
    { id: 2, title: 'Parent-Teacher Meeting', date: 'Mar 28, 2024', type: 'meeting' },
    { id: 3, title: 'Sports Day', date: 'Apr 5, 2024', type: 'event' },
    { id: 4, title: 'Term 1 Closing', date: 'Apr 12, 2024', type: 'holiday' },
  ];

  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome back! Here's what's happening today.">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
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
        {/* Enrollment Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Enrollment Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#4361ee" 
                    strokeWidth={3}
                    dot={{ fill: '#4361ee', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Students by Education Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={levelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {levelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-40 space-y-2">
                {levelDistribution.map((item, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-slate-600">{item.name}</span>
                    <span className="ml-auto font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-500">{activity.name}</p>
                  </div>
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{event.title}</p>
                    <p className="text-sm text-slate-500">{event.date}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
