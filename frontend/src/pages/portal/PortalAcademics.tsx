import React, { useState, useEffect } from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  Star,
  Loader2,
  Download,
  BarChart3,
  Target,
  TrendingDown,
  Users,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface SubjectGrade {
  id: number;
  subject: string;
  subject_value: string;
  marks: number;
  grade: string;
  grade_display: string;
  points: number;
  teacher: string;
  remarks: string | null;
}

interface AcademicSummary {
  term: string;
  year: number;
  average_score: number;
  average_grade: string;
  mean_grade: string;
  class_rank: number;
  total_students: number;
  attendance_percentage: number;
  grade_points: number;
  is_current: boolean;
  remarks: string | null;
}

interface AcademicHistory {
  id: number;
  term: string;
  year: number;
  average_score: number;
  average_grade: string;
  mean_grade: string;
  class_rank: number;
  total_students: number;
  attendance_percentage: number;
  is_current: boolean;
  remarks: string | null;
}

interface PerformanceStats {
  overall_average: number;
  best_subject: {
    subject: string;
    marks: number;
    grade: string;
  } | null;
  total_subjects: number;
  grade_distribution: {
    A: number;
    'A-': number;
    'B+': number;
    'B': number;
    'B-': number;
    other: number;
  };
}

interface GradeGuide {
  grade: string;
  range: string;
  points: number;
  description: string;
}

const PortalAcademics = () => {
  const { apiRequest } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<AcademicSummary | null>(null);
  const [currentGrades, setCurrentGrades] = useState<SubjectGrade[]>([]);
  const [academicHistory, setAcademicHistory] = useState<AcademicHistory[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [gradeGuide, setGradeGuide] = useState<GradeGuide[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjectHistory, setSubjectHistory] = useState<any>(null);

  useEffect(() => {
    fetchAcademicData();
    fetchGradeGuide();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchSubjectHistory(selectedSubject);
    } else {
      setSubjectHistory(null); // Clear subject history when nothing is selected
    }
  }, [selectedSubject]);

  const fetchAcademicData = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiRequest('/academics/summary/');
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        setCurrentSummary(data.current_summary || null);
        setCurrentGrades(data.current_grades || []);
        setAcademicHistory(data.academic_history || []);
        setPerformanceStats(data.performance_stats || null);
      }
    } catch (error) {
      console.error('Error fetching academic data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load academic records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGradeGuide = async () => {
    try {
      setLoadingGuide(true);
      const { data, error } = await apiRequest('/academics/grade-guide/');
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success && data.grade_guide) {
        setGradeGuide(data.grade_guide);
      }
    } catch (error) {
      console.error('Error fetching grade guide:', error);
    } finally {
      setLoadingGuide(false);
    }
  };

  const fetchSubjectHistory = async (subject: string) => {
    try {
      const { data, error } = await apiRequest(`/academics/subject/${subject}/history/`);
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        setSubjectHistory(data);
      }
    } catch (error) {
      console.error('Error fetching subject history:', error);
    }
  };

  const handleDownloadReportCard = async (summaryId: number) => {
    try {
      // Create a temporary link to trigger download
      const response = await fetch(`/api/academics/report-card/${summaryId}/download/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kids_league_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_card_${currentSummary?.term}_${currentSummary?.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download report card',
        variant: 'destructive',
      });
    }
  };

  const getGradeBadge = (grade: string) => {
    if (grade.startsWith('A')) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1">
          <Star className="w-3 h-3" />
          {grade}
        </Badge>
      );
    } else if (grade.startsWith('B')) {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
          <Bookmark className="w-3 h-3" />
          {grade}
        </Badge>
      );
    } else if (grade.startsWith('C')) {
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 flex items-center gap-1">
          <Target className="w-3 h-3" />
          {grade}
        </Badge>
      );
    } else if (grade.startsWith('D')) {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          {grade}
        </Badge>
      );
    }
    return <Badge variant="secondary">{grade}</Badge>;
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-amber-600';
    if (grade.startsWith('D')) return 'text-red-600';
    return 'text-slate-600';
  };

  const getGradeProgress = (marks: number) => {
    if (marks >= 75) return 'bg-emerald-500';
    if (marks >= 60) return 'bg-blue-500';
    if (marks >= 45) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <BeneficiaryLayout title="Academic Records" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-slate-600">Loading academic records...</p>
          </div>
        </div>
      </BeneficiaryLayout>
    );
  }

  const summaryStats = [
    { 
      title: 'Current Average', 
      value: currentSummary ? `${currentSummary.average_score.toFixed(1)}%` : '0%',
      icon: TrendingUp, 
      color: 'bg-emerald-500',
      description: `${currentSummary?.mean_grade || 'N/A'} Mean Grade`
    },
    { 
      title: 'Class Rank', 
      value: currentSummary ? `${currentSummary.class_rank} / ${currentSummary.total_students}` : 'N/A',
      icon: Award, 
      color: 'bg-blue-500',
      description: `Top ${currentSummary ? Math.round((currentSummary.class_rank / currentSummary.total_students) * 100) : 0}%`
    },
    { 
      title: 'Best Subject', 
      value: performanceStats?.best_subject ? `${performanceStats.best_subject.subject}` : 'N/A',
      icon: Star, 
      color: 'bg-amber-500',
      description: performanceStats?.best_subject ? `${performanceStats.best_subject.marks}% (${performanceStats.best_subject.grade})` : 'No data'
    },
    { 
      title: 'Attendance', 
      value: currentSummary ? `${currentSummary.attendance_percentage.toFixed(1)}%` : '0%',
      icon: Calendar, 
      color: 'bg-purple-500',
      description: `${currentSummary?.grade_points || 0} Grade Points`
    },
  ];

  return (
    <BeneficiaryLayout title="Academic Records" subtitle="View your academic performance and progress">
      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {stat.title === 'Current Average' && currentSummary?.remarks && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: 'Academic Remarks',
                        description: currentSummary.remarks,
                      });
                    }}
                  >
                    <BookOpen className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Term Grades */}
      <Card className="border-0 shadow-md mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            {currentSummary ? `${currentSummary.term} ${currentSummary.year} Grades` : 'Current Term Grades'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="View subject history" />
              </SelectTrigger>
              <SelectContent>
                {currentGrades.map((grade) => (
                  <SelectItem key={grade.subject_value} value={grade.subject_value}>
                    {grade.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentSummary && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDownloadReportCard(currentSummary.year)}
              >
                <Download className="w-4 h-4 mr-2" />
                Report Card
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentGrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <BookOpen className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-600 mb-2">No grades available for current term</p>
              <p className="text-sm text-slate-500">Academic records will be updated by your institution</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentGrades.map((subject) => (
                  <TableRow key={subject.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center justify-between">
                        <span>{subject.subject}</span>
                        {subject.remarks && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: `${subject.subject} Remarks`,
                                description: subject.remarks,
                              });
                            }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{subject.teacher || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{subject.marks}/100</span>
                        <span className="text-xs text-slate-500">
                          {subject.grade_display}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={getGradeColor(subject.grade)}>
                        {getGradeBadge(subject.grade)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {subject.points}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-32">
                        <Progress value={subject.marks} className={`h-2 ${getGradeProgress(subject.marks)}`} />
                        <span className="text-xs text-slate-500 mt-1">
                          {subject.marks >= 75 ? 'Excellent' : 
                           subject.marks >= 60 ? 'Good' : 
                           subject.marks >= 45 ? 'Average' : 'Needs Improvement'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Subject History Modal */}
      {selectedSubject && subjectHistory && (
        <Card className="border-0 shadow-md mb-6 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              {subjectHistory.subject} Performance History
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedSubject('')}
                className="ml-auto"
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Average Marks</p>
                <p className="text-2xl font-bold text-slate-900">
                  {subjectHistory.average_marks.toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Highest Score</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {subjectHistory.highest_marks}%
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Terms Taken</p>
                <p className="text-2xl font-bold text-blue-600">
                  {subjectHistory.total_terms}
                </p>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectHistory.grade_trend.map((term: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {term.term} {term.year}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{term.marks}%</span>
                        <Progress value={term.marks} className="w-20 h-2" />
                      </div>
                    </TableCell>
                    <TableCell>{getGradeBadge(term.grade)}</TableCell>
                    <TableCell>{term.teacher || 'N/A'}</TableCell>
                    <TableCell>
                      {index > 0 && (
                        <span className={`text-sm ${
                          term.marks > subjectHistory.grade_trend[index-1].marks 
                            ? 'text-emerald-600' 
                            : term.marks < subjectHistory.grade_trend[index-1].marks 
                            ? 'text-red-600' 
                            : 'text-slate-600'
                        }`}>
                          {term.marks > subjectHistory.grade_trend[index-1].marks ? '↗' : 
                           term.marks < subjectHistory.grade_trend[index-1].marks ? '↘' : '→'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Performance History */}
      <Card className="border-0 shadow-md mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Performance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {academicHistory.length === 0 ? (
            <div className="text-center p-6">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No academic history available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Average Score</TableHead>
                  <TableHead>Mean Grade</TableHead>
                  <TableHead>Class Rank</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academicHistory.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-medium">
                      {term.term} {term.year}
                      {term.remarks && (
                        <p className="text-xs text-slate-500 mt-1">{term.remarks}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{term.average_score.toFixed(1)}%</span>
                        <span className="text-xs text-slate-500">
                          Grade: {term.average_grade}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(term.mean_grade)}>
                        {term.mean_grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{term.class_rank} / {term.total_students}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-32">
                        <Progress value={term.attendance_percentage} className="h-2" />
                        <span className="text-xs text-slate-500">
                          {term.attendance_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {term.is_current 
                        ? <Badge className="bg-emerald-100 text-emerald-700">Current</Badge>
                        : <Badge variant="secondary">Completed</Badge>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Grade Guide */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Grade Guide {loadingGuide && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gradeGuide.map((grade) => (
              <div key={grade.grade} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`text-lg px-3 py-1 ${
                    grade.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                    grade.grade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                    grade.grade.startsWith('C') ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {grade.grade}
                  </Badge>
                  <span className="font-mono text-sm text-slate-500">{grade.points} pts</span>
                </div>
                <p className="text-sm text-slate-600">{grade.range}</p>
                <p className="text-slate-700 mt-1">{grade.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-700 mb-2">Understanding Your Grades</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>Grades are calculated based on Kenya's 8-4-4 education system grading</li>
              <li>Mean Grade is calculated from all subject grades</li>
              <li>Points are used for university placement calculations</li>
              <li>Class Rank shows your position relative to classmates</li>
              <li>Attendance affects your overall academic standing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </BeneficiaryLayout>
  );
};

export default PortalAcademics;