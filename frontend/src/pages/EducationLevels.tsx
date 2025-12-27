import React from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  GraduationCap,
  BookOpen,
  ArrowRight,
  School,
  Building2,
  Wrench
} from 'lucide-react';

const educationLevelsData = {
  'pre-school': {
    title: 'Pre-School',
    description: 'Early childhood education programs for ages 3-6',
    icon: BookOpen,
    color: 'from-pink-500 to-rose-500',
    stats: {
      totalStudents: 320,
      activeStudents: 298,
      avgPerformance: 82.5,
      passingRate: 95.2,
    },
    grades: ['Baby Class', 'PP1', 'PP2'],
  },
  'primary': {
    title: 'Primary',
    description: 'Fundamental education for grades 1-8',
    icon: School,
    color: 'from-blue-500 to-cyan-500',
    stats: {
      totalStudents: 890,
      activeStudents: 856,
      avgPerformance: 78.3,
      passingRate: 91.5,
    },
    grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'],
  },
  'secondary': {
    title: 'Secondary',
    description: 'High school education for Forms 1-4',
    icon: GraduationCap,
    color: 'from-purple-500 to-indigo-500',
    stats: {
      totalStudents: 654,
      activeStudents: 621,
      avgPerformance: 75.8,
      passingRate: 88.3,
    },
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
  },
  'university': {
    title: 'University/College',
    description: 'Higher education and degree programs',
    icon: Building2,
    color: 'from-orange-500 to-amber-500',
    stats: {
      totalStudents: 423,
      activeStudents: 401,
      avgPerformance: 72.4,
      passingRate: 85.7,
    },
    grades: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'],
  },
  'vocational': {
    title: 'Vocational',
    description: 'Technical and vocational training programs',
    icon: Wrench,
    color: 'from-green-500 to-emerald-500',
    stats: {
      totalStudents: 560,
      activeStudents: 534,
      avgPerformance: 80.1,
      passingRate: 92.8,
    },
    grades: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Diploma'],
  },
};

const EducationLevels = () => {
  const { level } = useParams<{ level?: string }>();

  // If no specific level, show overview
  if (!level) {
    return (
      <DashboardLayout title="Education Levels" subtitle="Overview of all education programs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(educationLevelsData).map(([key, data]) => (
            <Card key={key} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${data.color}`}></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${data.color} flex items-center justify-center`}>
                    <data.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="outline">{data.stats.totalStudents} students</Badge>
                </div>
                <CardTitle className="mt-4">{data.title}</CardTitle>
                <p className="text-slate-600 text-sm">{data.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Avg. Performance</span>
                      <span className="font-medium">{data.stats.avgPerformance}%</span>
                    </div>
                    <Progress value={data.stats.avgPerformance} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Passing Rate</span>
                      <span className="font-medium">{data.stats.passingRate}%</span>
                    </div>
                    <Progress value={data.stats.passingRate} className="h-2" />
                  </div>
                  <Link to={`/education/${key}`}>
                    <Button variant="outline" className="w-full mt-4">
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // Show specific level details
  const levelData = educationLevelsData[level as keyof typeof educationLevelsData];

  if (!levelData) {
    return (
      <DashboardLayout title="Education Level" subtitle="Level not found">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-600">The requested education level was not found.</p>
            <Link to="/education">
              <Button className="mt-4">Back to Education Levels</Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={levelData.title} subtitle={levelData.description}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Total Students</p>
                <h3 className="text-2xl font-bold text-slate-900">{levelData.stats.totalStudents}</h3>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${levelData.color} flex items-center justify-center`}>
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Active Students</p>
                <h3 className="text-2xl font-bold text-slate-900">{levelData.stats.activeStudents}</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Avg. Performance</p>
                <h3 className="text-2xl font-bold text-slate-900">{levelData.stats.avgPerformance}%</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Passing Rate</p>
                <h3 className="text-2xl font-bold text-slate-900">{levelData.stats.passingRate}%</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades/Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
            Classes & Grades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {levelData.grades.map((grade, index) => (
              <Card key={index} className="hover:shadow-md transition-all duration-300 cursor-pointer hover:border-blue-300">
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${levelData.color} flex items-center justify-center mx-auto mb-3`}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-medium text-slate-900">{grade}</p>
                  <p className="text-sm text-slate-500 mt-1">{Math.floor(Math.random() * 50) + 20} students</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default EducationLevels;
