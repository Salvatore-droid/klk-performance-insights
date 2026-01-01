import React from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Receipt, 
  Download, 
  Eye, 
  Upload,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PortalStatements = () => {
  const statements = [
    { id: 1, term: 'Term 1 2024', school: 'Moi Girls Secondary', amount: 45000, balance: 15000, dueDate: '2024-02-15', status: 'partial' },
    { id: 2, term: 'Term 3 2023', school: 'Moi Girls Secondary', amount: 42000, balance: 0, dueDate: '2023-11-30', status: 'paid' },
    { id: 3, term: 'Term 2 2023', school: 'Moi Girls Secondary', amount: 42000, balance: 0, dueDate: '2023-08-15', status: 'paid' },
    { id: 4, term: 'Term 1 2023', school: 'Moi Girls Secondary', amount: 40000, balance: 0, dueDate: '2023-02-28', status: 'paid' },
  ];

  const summaryStats = [
    { title: 'Total Fees (2024)', value: 'KES 135,000', icon: DollarSign, color: 'bg-blue-500', change: '+8%' },
    { title: 'Amount Paid', value: 'KES 120,000', icon: TrendingUp, color: 'bg-emerald-500', change: '89%' },
    { title: 'Outstanding Balance', value: 'KES 15,000', icon: TrendingDown, color: 'bg-amber-500', change: '11%' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Fully Paid</Badge>;
      case 'partial':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Partial Payment</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <BeneficiaryLayout title="Fee Statements" subtitle="View and manage your fee statements">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Fee Statement Button */}
      <div className="flex justify-end mb-6">
        <Link to="/portal/upload">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Fee Statement
          </Button>
        </Link>
      </div>

      {/* Statements Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Fee Statements History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term / Year</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statements.map((statement) => (
                <TableRow key={statement.id}>
                  <TableCell className="font-medium">{statement.term}</TableCell>
                  <TableCell>{statement.school}</TableCell>
                  <TableCell>KES {statement.amount.toLocaleString()}</TableCell>
                  <TableCell className={statement.balance > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600'}>
                    KES {statement.balance.toLocaleString()}
                  </TableCell>
                  <TableCell>{statement.dueDate}</TableCell>
                  <TableCell>{getStatusBadge(statement.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Outstanding Balance Notice */}
      <Card className="border-0 shadow-md mt-6 bg-amber-50 border-l-4 border-l-amber-500">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-full">
              <Receipt className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800">Outstanding Balance Notice</h3>
              <p className="text-amber-700 mt-1">
                You have an outstanding balance of <strong>KES 15,000</strong> for Term 1 2024. 
                Please ensure payment is made before the due date to avoid any disruptions.
              </p>
              <Button className="mt-3 bg-amber-600 hover:bg-amber-700">
                Contact Financial Aid Office
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </BeneficiaryLayout>
  );
};

export default PortalStatements;
