
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search, 
  Bell, 
  Mail, 
  FileDown, 
  Filter, 
  TrendingUp, 
  Users, 
  Award, 
  BookOpen,
  GraduationCap,
  Medal,
  ChevronDown,
  Menu,
  Home,
  DollarSign,
  Calendar,
  Settings,
  LogOut
} from 'lucide-react';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('2023');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Sample data for charts
  const performanceTrendData = [
    { term: 'Term 1', average: 72.3, improvement: 68.5, passing: 83.2 },
    { term: 'Term 2', average: 75.8, improvement: 71.2, passing: 86.7 },
    { term: 'Term 3', average: 78.5, improvement: 72.4, passing: 89.3 },
  ];

  const subjectPerformanceData = [
    { subject: 'Mathematics', score: 82.4, color: '#4361ee' },
    { subject: 'English', score: 78.9, color: '#4895ef' },
    { subject: 'Science', score: 85.2, color: '#4cc9f0' },
    { subject: 'Kiswahili', score: 76.3, color: '#f8961e' },
    { subject: 'Social Studies', score: 79.7, color: '#f72585' },
  ];

  const levelDistributionData = [
    { level: 'Pre-School', students: 45, color: '#4361ee' },
    { level: 'Primary', students: 128, color: '#4895ef' },
    { level: 'Secondary', students: 89, color: '#4cc9f0' },
    { level: 'University', students: 23, color: '#f8961e' },
    { level: 'Vocational', students: 34, color: '#f72585' },
  ];

  const topPerformers = [
    { id: 1, name: 'Jane Muthoni', level: 'Form 2', score: 96.8, avatar: '/api/placeholder/40/40', improvement: '+5.2%' },
    { id: 2, name: 'Kevin Ochieng', level: 'Grade 8', score: 94.5, avatar: '/api/placeholder/40/40', improvement: '+3.8%' },
    { id: 3, name: 'Grace Wanjiku', level: 'Form 4', score: 93.7, avatar: '/api/placeholder/40/40', improvement: '+4.1%' },
    { id: 4, name: 'Michael Kimani', level: 'Grade 7', score: 92.3, avatar: '/api/placeholder/40/40', improvement: '+2.9%' },
    { id: 5, name: 'Sarah Akinyi', level: 'Form 3', score: 91.8, avatar: '/api/placeholder/40/40', improvement: '+6.3%' },
  ];

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-40 ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center p-6 border-b border-slate-700">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          {!sidebarCollapsed && (
            <h2 className="text-xl font-bold">Kids League Kenya</h2>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors">
            <Home className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors">
            <Users className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && <span>Beneficiaries</span>}
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors">
            <BookOpen className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && <span>Education Levels</span>}
            {!sidebarCollapsed && <ChevronDown className="w-4 h-4 ml-auto" />}
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors">
            <DollarSign className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && <span>Financial Aid</span>}
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg bg-blue-600 text-white">
            <BarChart className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && <span>Performance Analytics</span>}
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors">
            <Calendar className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && <span>Academic Calendar</span>}
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors">
            <Mail className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && <span>Communication</span>}
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors">
            <Settings className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && <span>System Settings</span>}
          </a>
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center mb-4">
            <Avatar className="w-10 h-10 mr-3">
              <AvatarImage src="/api/placeholder/40/40" />
              <AvatarFallback>AU</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div>
                <h4 className="font-semibold text-sm">Admin User</h4>
                <p className="text-xs text-slate-400">admin@klk.org</p>
              </div>
            )}
          </div>
          <a href="#" className="flex items-center text-slate-300 hover:text-white transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && <span>Logout</span>}
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="mr-4"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Performance Analytics</h1>
                <p className="text-slate-600 mt-1">Track and analyze student academic performance across all levels</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search students, subjects..." 
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  5
                </Badge>
              </Button>
              <Button variant="ghost" size="sm">
                <Mail className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback>AU</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Analytics Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-4"></div>
                  Academic Performance Overview
                </CardTitle>
                <div className="flex space-x-3">
                  <Button>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Education Level</label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      <SelectItem value="pre-school">Pre-School</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="university">University/College</SelectItem>
                      <SelectItem value="vocational">Vocational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Terms</SelectItem>
                      <SelectItem value="term1">Term 1</SelectItem>
                      <SelectItem value="term2">Term 2</SelectItem>
                      <SelectItem value="term3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Academic Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                      <SelectItem value="2020">2020</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Subjects</SelectItem>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="kiswahili">Kiswahili</SelectItem>
                      <SelectItem value="social">Social Studies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center text-slate-600 mb-2">
                      <GraduationCap className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Average Score</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-2">78.5%</div>
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      3.2% from last term
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center text-slate-600 mb-2">
                      <Medal className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Top Score</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">96.8%</div>
                    <div className="text-sm text-slate-600">Jane Muthoni (Form 2)</div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center text-slate-600 mb-2">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Improvement Rate</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-2">72.4%</div>
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      8.1% from last term
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center text-slate-600 mb-2">
                      <Award className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Passing Rate</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-2">89.3%</div>
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      2.7% from last term
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                    Performance Trend
                  </CardTitle>
                  <Tabs defaultValue="terms" className="w-auto">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="terms">By Term</TabsTrigger>
                      <TabsTrigger value="subjects">By Subject</TabsTrigger>
                      <TabsTrigger value="levels">By Level</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="term" stroke="#64748b" />
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
                        dataKey="average" 
                        stroke="#4361ee" 
                        strokeWidth={3}
                        dot={{ fill: '#4361ee', strokeWidth: 2, r: 6 }}
                        name="Average Score"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="improvement" 
                        stroke="#4cc9f0" 
                        strokeWidth={3}
                        dot={{ fill: '#4cc9f0', strokeWidth: 2, r: 6 }}
                        name="Improvement Rate"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="passing" 
                        stroke="#f8961e" 
                        strokeWidth={3}
                        dot={{ fill: '#f8961e', strokeWidth: 2, r: 6 }}
                        name="Passing Rate"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Subject Performance Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                    Subject Performance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformanceData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis dataKey="subject" type="category" stroke="#64748b" width={80} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="score" fill="#4361ee" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Student</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Level</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Score</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Performance</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Improvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((student) => (
                      <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <Avatar className="w-10 h-10 mr-3">
                              <AvatarImage src={student.avatar} />
                              <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-slate-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600">{student.level}</td>
                        <td className="py-4 px-4">
                          <span className="text-2xl font-bold text-slate-900">{student.score}%</span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getScoreBadgeVariant(student.score)}>
                            {getScoreLabel(student.score)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-green-600 font-medium">{student.improvement}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
