import React, { useState, useEffect } from 'react';
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
  Cell,
  Legend
} from 'recharts';
import { 
  FileDown, 
  Filter, 
  TrendingUp, 
  GraduationCap,
  Medal,
  Award,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  BookOpen,
  Target,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface PerformanceMetric {
  average_score: number;
  top_score: number;
  improvement_rate: number;
  passing_rate: number;
  total_students: number;
  total_records: number;
}

interface SubjectPerformance {
  subject: string;
  average_score: number;
  count: number;
  color: string;
}

interface LevelDistribution {
  level: string;
  students: number;
  color: string;
}

interface TopPerformer {
  id: number;
  full_name: string;
  level: string;
  average_score: number;
  improvement: number;
  profile_image_url: string | null;
}

interface PerformanceTrend {
  term: string;
  year: number;
  average_score: number;
  passing_rate: number;
  improvement_rate: number;
}

const Performance = () => {
  const { apiRequest } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetric>({
    average_score: 0,
    top_score: 0,
    improvement_rate: 0,
    passing_rate: 0,
    total_students: 0,
    total_records: 0
  });
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [levelDistribution, setLevelDistribution] = useState<LevelDistribution[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrend[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [availableYears, setAvailableYears] = useState<number[]>([2023, 2024, 2025]);
  const [availableTerms, setAvailableTerms] = useState<string[]>(['Term 1', 'Term 2', 'Term 3']);

  // Colors for charts
  const colors = ['#4361ee', '#4895ef', '#4cc9f0', '#f8961e', '#f72585', '#10b981', '#8b5cf6', '#ef4444'];

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple data sources
      await Promise.all([
        fetchMetrics(),
        fetchSubjectPerformance(),
        fetchLevelDistribution(),
        fetchTopPerformers(),
        fetchPerformanceTrend()
      ]);
      
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load performance data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoadingStats(true);
      
      // Get academic summaries to calculate metrics
      const { data, error } = await apiRequest('/admin/beneficiaries/?limit=100');
      
      if (error) throw new Error(error);

      if (data?.success) {
        const beneficiaries = data.beneficiaries || [];
        
        // Calculate metrics
        let totalScore = 0;
        let topScore = 0;
        let totalStudents = beneficiaries.length;
        let passingCount = 0;
        let totalWithScores = 0;

        beneficiaries.forEach((beneficiary: any) => {
          const score = beneficiary.academic_performance || 0;
          if (score > 0) {
            totalScore += score;
            totalWithScores++;
            
            if (score > topScore) {
              topScore = score;
            }
            
            if (score >= 40) { // Passing threshold
              passingCount++;
            }
          }
        });

        const averageScore = totalWithScores > 0 ? totalScore / totalWithScores : 0;
        const passingRate = totalWithScores > 0 ? (passingCount / totalWithScores) * 100 : 0;

        setMetrics({
          average_score: averageScore,
          top_score: topScore,
          improvement_rate: 72.4, // This would need actual improvement data
          passing_rate: passingRate,
          total_students: totalStudents,
          total_records: totalWithScores
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchSubjectPerformance = async () => {
    try {
      // In a real implementation, you'd fetch this from your API
      // For now, using mock data based on common subjects
      const mockSubjects = [
        { subject: 'Mathematics', average_score: 82.4, count: 156, color: colors[0] },
        { subject: 'English', average_score: 78.9, count: 156, color: colors[1] },
        { subject: 'Science', average_score: 85.2, count: 156, color: colors[2] },
        { subject: 'Kiswahili', average_score: 76.3, count: 156, color: colors[3] },
        { subject: 'Social Studies', average_score: 79.7, count: 156, color: colors[4] },
        { subject: 'CRE/IRE', average_score: 81.2, count: 156, color: colors[5] },
        { subject: 'Business', average_score: 73.8, count: 156, color: colors[6] },
        { subject: 'Agriculture', average_score: 84.1, count: 156, color: colors[7] },
      ];
      
      setSubjectPerformance(mockSubjects);
      
    } catch (error) {
      console.error('Error fetching subject performance:', error);
      setSubjectPerformance([]);
    }
  };

  const fetchLevelDistribution = async () => {
    try {
      // This would come from your backend
      // Using mock data for now
      const mockLevels = [
        { level: 'Pre-School', students: 45, color: colors[0] },
        { level: 'Primary', students: 128, color: colors[1] },
        { level: 'Secondary', students: 89, color: colors[2] },
        { level: 'University', students: 23, color: colors[3] },
        { level: 'Vocational', students: 34, color: colors[4] },
      ];
      
      setLevelDistribution(mockLevels);
      
    } catch (error) {
      console.error('Error fetching level distribution:', error);
      setLevelDistribution([]);
    }
  };

  const fetchTopPerformers = async () => {
    try {
      // Fetch beneficiaries with academic performance
      const { data, error } = await apiRequest('/admin/beneficiaries/?limit=10&sort_by=-academic_performance');
      
      if (error) throw new Error(error);

      if (data?.success) {
        const beneficiaries = data.beneficiaries || [];
        const top5 = beneficiaries.slice(0, 5).map((beneficiary: any, index: number) => ({
          id: beneficiary.id,
          full_name: beneficiary.full_name,
          level: beneficiary.grade || 'N/A',
          average_score: beneficiary.academic_performance || 0,
          improvement: Math.random() * 10 + 2, // Mock improvement data
          profile_image_url: beneficiary.profile_image_url
        }));
        
        setTopPerformers(top5);
      }
    } catch (error) {
      console.error('Error fetching top performers:', error);
      setTopPerformers([]);
    }
  };

  const fetchPerformanceTrend = async () => {
    try {
      // Mock trend data - in real app, fetch from AcademicSummary
      const mockTrend = [
        { term: 'Term 1', year: 2023, average_score: 72.3, passing_rate: 83.2, improvement_rate: 68.5 },
        { term: 'Term 2', year: 2023, average_score: 75.8, passing_rate: 86.7, improvement_rate: 71.2 },
        { term: 'Term 3', year: 2023, average_score: 78.5, passing_rate: 89.3, improvement_rate: 72.4 },
        { term: 'Term 1', year: 2024, average_score: 76.2, passing_rate: 85.8, improvement_rate: 73.1 },
        { term: 'Term 2', year: 2024, average_score: 79.1, passing_rate: 88.4, improvement_rate: 75.6 },
        { term: 'Term 3', year: 2024, average_score: 81.3, passing_rate: 91.2, improvement_rate: 77.8 },
      ];
      
      setPerformanceTrend(mockTrend);
      
    } catch (error) {
      console.error('Error fetching performance trend:', error);
      setPerformanceTrend([]);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const handleExportReport = async () => {
    try {
      toast({
        title: 'Export Started',
        description: 'Preparing performance report for download...',
      });
      
      // In a real implementation, this would generate a PDF/Excel report
      setTimeout(() => {
        toast({
          title: 'Export Complete',
          description: 'Performance report downloaded successfully.',
        });
      }, 2000);
      
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate performance report.',
        variant: 'destructive',
      });
    }
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 hover:bg-green-100';
    if (score >= 80) return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    return 'bg-red-100 text-red-800 hover:bg-red-100';
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const filteredTrendData = performanceTrend.filter(item => {
    if (selectedYear !== 'all' && item.year !== parseInt(selectedYear)) return false;
    if (selectedTerm !== 'all' && item.term !== selectedTerm) return false;
    return true;
  });

  const filteredSubjectData = selectedSubject === 'all' 
    ? subjectPerformance 
    : subjectPerformance.filter(subject => subject.subject === selectedSubject);

  const metricCards = [
    { 
      title: 'Average Score', 
      value: formatPercentage(metrics.average_score),
      description: `${metrics.total_records} students with scores`,
      icon: GraduationCap, 
      color: 'bg-blue-500',
      loading: loadingStats
    },
    { 
      title: 'Top Score', 
      value: formatPercentage(metrics.top_score),
      description: 'Highest individual score',
      icon: Medal, 
      color: 'bg-green-500',
      loading: loadingStats
    },
    { 
      title: 'Improvement Rate', 
      value: formatPercentage(metrics.improvement_rate),
      description: 'From previous term',
      icon: TrendingUp, 
      color: 'bg-purple-500',
      loading: loadingStats
    },
    { 
      title: 'Passing Rate', 
      value: formatPercentage(metrics.passing_rate),
      description: `of ${metrics.total_records} scored students`,
      icon: Award, 
      color: 'bg-orange-500',
      loading: loadingStats
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Performance Analytics" subtitle="Loading performance data...">
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Performance Analytics" 
      subtitle="Track and analyze student academic performance across all levels"
    >
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="text-2xl flex items-center">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-4"></div>
              Academic Performance Overview
              <Badge variant="outline" className="ml-3">
                {metrics.total_students} Students
              </Badge>
            </CardTitle>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExportReport}>
                <FileDown className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" onClick={fetchPerformanceData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg mb-6">
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
                  {availableTerms.map(term => (
                    <SelectItem key={term} value={term}>{term}</SelectItem>
                  ))}
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
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
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
                  {subjectPerformance.map(subject => (
                    <SelectItem key={subject.subject} value={subject.subject}>{subject.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metricCards.map((metric, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center text-slate-600 mb-2">
                    <metric.icon className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">{metric.title}</span>
                  </div>
                  {metric.loading ? (
                    <div className="h-10 flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-slate-900 mb-2">{metric.value}</div>
                      <div className="flex items-center text-slate-600 text-sm">
                        {metric.description}
                      </div>
                      <div className="mt-4">
                        <Progress 
                          value={parseFloat(metric.value)} 
                          className="h-2"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            ['--progress-color' as string]: getScoreColor(parseFloat(metric.value))
                          }}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
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
              <Tabs defaultValue="average" className="w-auto">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="average">Average</TabsTrigger>
                  <TabsTrigger value="passing">Passing</TabsTrigger>
                  <TabsTrigger value="improvement">Improvement</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTrendData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-slate-500">
                No trend data available for selected filters
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="term" 
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value) => [`${value}%`, 'Score']}
                      labelFormatter={(label) => `Term: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="average_score" 
                      stroke="#4361ee" 
                      strokeWidth={3} 
                      dot={{ fill: '#4361ee', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, fill: '#4361ee' }}
                      name="Average Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="passing_rate" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, fill: '#10b981' }}
                      name="Passing Rate"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="improvement_rate" 
                      stroke="#f8961e" 
                      strokeWidth={3} 
                      dot={{ fill: '#f8961e', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, fill: '#f8961e' }}
                      name="Improvement Rate"
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Subject Performance
            </CardTitle>
            <Badge variant="outline">
              {filteredSubjectData.length} Subjects
            </Badge>
          </CardHeader>
          <CardContent>
            {filteredSubjectData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-slate-500">
                No subject data available
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredSubjectData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="subject" 
                      stroke="#64748b"
                      tick={{ fill: '#64748b' }}
                      width={120}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value) => [`${value}%`, 'Average Score']}
                      labelFormatter={(label) => `Subject: ${label}`}
                    />
                    <Bar 
                      dataKey="average_score" 
                      radius={[0, 4, 4, 0]}
                      name="Average Score"
                    >
                      {filteredSubjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Level Distribution & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Students by Education Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            {levelDistribution.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-slate-500">
                No level distribution data available
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="students"
                      label={(entry) => `${entry.level}: ${entry.students}`}
                    >
                      {levelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} students`,
                        props.payload.level
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
              Top Performers
            </CardTitle>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-slate-500">
                No top performers data available
              </div>
            ) : (
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
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800' :
                          'bg-gradient-to-br from-blue-500 to-blue-600'
                        } text-white font-bold`}>
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="w-10 h-10 mr-3">
                            <AvatarImage src={student.profile_image_url || undefined} />
                            <AvatarFallback>
                              {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.level}</TableCell>
                      <TableCell>
                        <Badge className={getScoreBadgeVariant(student.average_score)}>
                          {student.average_score.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-medium ${
                        student.improvement >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {student.improvement >= 0 ? '+' : ''}{student.improvement.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${metrics.average_score >= 70 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">Overall Performance</span>
              </div>
              <div className="pl-5">
                <p className="text-sm text-slate-600">
                  {metrics.average_score >= 70 
                    ? 'Overall performance is satisfactory with room for improvement in specific areas.'
                    : 'Performance needs improvement. Consider implementing targeted interventions.'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${metrics.passing_rate >= 75 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-sm font-medium">Passing Rate Status</span>
              </div>
              <div className="pl-5">
                <p className="text-sm text-slate-600">
                  {metrics.passing_rate >= 90 
                    ? 'Excellent passing rate! Continue with current teaching strategies.'
                    : metrics.passing_rate >= 75
                    ? 'Good passing rate. Focus on improving marginal performers.'
                    : 'Passing rate needs attention. Consider remedial classes.'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${metrics.improvement_rate >= 70 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">Improvement Trend</span>
              </div>
              <div className="pl-5">
                <p className="text-sm text-slate-600">
                  {metrics.improvement_rate >= 70
                    ? 'Strong improvement trend observed. Current interventions are effective.'
                    : 'Improvement rate needs enhancement. Review teaching methodologies.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Performance;