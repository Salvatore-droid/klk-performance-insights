import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  FileDown, 
  Filter, 
  TrendingUp, 
  GraduationCap,
  Medal,
  Award
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Performance = () => {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2023');
  const [selectedSubject, setSelectedSubject] = useState('all');

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
    { id: 1, name: 'Jane Muthoni', level: 'Form 2', score: 96.8, improvement: '+5.2%' },
    { id: 2, name: 'Kevin Ochieng', level: 'Grade 8', score: 94.5, improvement: '+3.8%' },
    { id: 3, name: 'Grace Wanjiku', level: 'Form 4', score: 93.7, improvement: '+4.1%' },
    { id: 4, name: 'Michael Kimani', level: 'Grade 7', score: 92.3, improvement: '+2.9%' },
    { id: 5, name: 'Sarah Akinyi', level: 'Form 3', score: 91.8, improvement: '+6.3%' },
  ];

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <DashboardLayout title="Performance Analytics" subtitle="Track and analyze student academic performance across all levels">
      <Card className="mb-8">
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
                  <SelectItem value="all">All Levels</SelectItem>
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
                  <SelectItem value="all">All Terms</SelectItem>
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
                  <SelectItem value="all">All Subjects</SelectItem>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                    }}
                  />
                  <Line type="monotone" dataKey="average" stroke="#4361ee" strokeWidth={3} dot={{ fill: '#4361ee' }} name="Average" />
                  <Line type="monotone" dataKey="improvement" stroke="#4cc9f0" strokeWidth={3} dot={{ fill: '#4cc9f0' }} name="Improvement" />
                  <Line type="monotone" dataKey="passing" stroke="#f8961e" strokeWidth={3} dot={{ fill: '#f8961e' }} name="Passing" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                  <YAxis type="category" dataKey="subject" stroke="#64748b" width={100} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value}%`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {subjectPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Improvement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPerformers.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="w-10 h-10 mr-3">
                        <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.level}</TableCell>
                  <TableCell>
                    <Badge className={getScoreBadgeVariant(student.score)}>{student.score}%</Badge>
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">{student.improvement}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Performance;
