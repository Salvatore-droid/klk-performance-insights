import React from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BookOpen, 
  TrendingUp,
  Award,
  Calendar,
  Star
} from 'lucide-react';

const PortalAcademics = () => {
  const grades = [
    { subject: 'Mathematics', grade: 'A', marks: 85, teacher: 'Mr. Ochieng' },
    { subject: 'English', grade: 'A-', marks: 78, teacher: 'Mrs. Wanjiku' },
    { subject: 'Kiswahili', grade: 'B+', marks: 72, teacher: 'Mwl. Mwangi' },
    { subject: 'Physics', grade: 'A', marks: 88, teacher: 'Mr. Kamau' },
    { subject: 'Chemistry', grade: 'B+', marks: 75, teacher: 'Mrs. Otieno' },
    { subject: 'Biology', grade: 'A-', marks: 80, teacher: 'Dr. Njeri' },
    { subject: 'History', grade: 'B', marks: 68, teacher: 'Mr. Kiprop' },
    { subject: 'Geography', grade: 'B+', marks: 74, teacher: 'Mrs. Mutua' },
  ];

  const terms = [
    { term: 'Term 1 2024', average: 78.5, rank: 5, totalStudents: 45, status: 'current' },
    { term: 'Term 3 2023', average: 76.2, rank: 7, totalStudents: 45, status: 'completed' },
    { term: 'Term 2 2023', average: 74.8, rank: 8, totalStudents: 44, status: 'completed' },
    { term: 'Term 1 2023', average: 72.1, rank: 10, totalStudents: 44, status: 'completed' },
  ];

  const getGradeBadge = (grade: string) => {
    if (grade.startsWith('A')) {
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{grade}</Badge>;
    } else if (grade.startsWith('B')) {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{grade}</Badge>;
    } else if (grade.startsWith('C')) {
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{grade}</Badge>;
    }
    return <Badge variant="secondary">{grade}</Badge>;
  };

  return (
    <BeneficiaryLayout title="Academic Records" subtitle="View your academic performance">
      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-emerald-100 rounded-full w-fit mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-500">Current Average</p>
            <p className="text-3xl font-bold text-slate-900">78.5%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-slate-500">Class Rank</p>
            <p className="text-3xl font-bold text-slate-900">5 / 45</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-amber-100 rounded-full w-fit mx-auto mb-3">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-sm text-slate-500">Best Subject</p>
            <p className="text-xl font-bold text-slate-900">Physics (88%)</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-slate-500">Attendance</p>
            <p className="text-3xl font-bold text-slate-900">96%</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Term Grades */}
      <Card className="border-0 shadow-md mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Current Term Grades (Term 1 2024)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((subject, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{subject.subject}</TableCell>
                  <TableCell>{subject.teacher}</TableCell>
                  <TableCell>{subject.marks}/100</TableCell>
                  <TableCell>{getGradeBadge(subject.grade)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Term History */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Performance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>Average Score</TableHead>
                <TableHead>Class Rank</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{term.term}</TableCell>
                  <TableCell>{term.average}%</TableCell>
                  <TableCell>{term.rank} / {term.totalStudents}</TableCell>
                  <TableCell>
                    {term.status === 'current' 
                      ? <Badge className="bg-emerald-100 text-emerald-700">Current</Badge>
                      : <Badge variant="secondary">Completed</Badge>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </BeneficiaryLayout>
  );
};

export default PortalAcademics;
