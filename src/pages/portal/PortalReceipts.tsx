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
  CheckCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PortalReceipts = () => {
  const receipts = [
    { id: 1, receiptNo: 'RCP-2024-001', date: '2024-01-15', amount: 30000, paymentMethod: 'M-Pesa', term: 'Term 1 2024', status: 'verified' },
    { id: 2, receiptNo: 'RCP-2023-045', date: '2023-11-20', amount: 42000, paymentMethod: 'Bank Transfer', term: 'Term 3 2023', status: 'verified' },
    { id: 3, receiptNo: 'RCP-2023-032', date: '2023-08-10', amount: 42000, paymentMethod: 'M-Pesa', term: 'Term 2 2023', status: 'verified' },
    { id: 4, receiptNo: 'RCP-2023-018', date: '2023-02-25', amount: 40000, paymentMethod: 'Bank Transfer', term: 'Term 1 2023', status: 'verified' },
    { id: 5, receiptNo: 'RCP-2024-002', date: '2024-01-25', amount: 15000, paymentMethod: 'Cash', term: 'Term 1 2024', status: 'pending' },
  ];

  const totalPaid = receipts.filter(r => r.status === 'verified').reduce((sum, r) => sum + r.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <BeneficiaryLayout title="My Receipts" subtitle="View your payment receipts">
      {/* Summary Card */}
      <Card className="border-0 shadow-md mb-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Total Payments Made</p>
              <p className="text-4xl font-bold mt-2">KES {totalPaid.toLocaleString()}</p>
              <p className="text-emerald-100 mt-1">{receipts.filter(r => r.status === 'verified').length} verified payments</p>
            </div>
            <Receipt className="w-16 h-16 text-emerald-200" />
          </div>
        </CardContent>
      </Card>

      {/* Upload Receipt Button */}
      <div className="flex justify-end mb-6">
        <Link to="/portal/upload">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Receipt
          </Button>
        </Link>
      </div>

      {/* Receipts Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Payment Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.receiptNo}</TableCell>
                  <TableCell>{receipt.date}</TableCell>
                  <TableCell>{receipt.term}</TableCell>
                  <TableCell className="font-medium">KES {receipt.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{receipt.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(receipt.status)}</TableCell>
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
    </BeneficiaryLayout>
  );
};

export default PortalReceipts;
