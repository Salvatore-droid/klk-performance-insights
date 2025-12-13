import React from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  GraduationCap,
  Edit,
  Shield
} from 'lucide-react';

const PortalProfile = () => {
  const profile = {
    name: 'Jane Muthoni Kamau',
    email: 'jane.muthoni@email.com',
    phone: '+254 712 345 678',
    address: 'Nairobi, Kenya',
    dateOfBirth: '2008-05-15',
    school: 'Moi Girls Secondary School',
    class: 'Form 2',
    admissionNumber: 'MGS/2022/0456',
    sponsorshipStatus: 'Active',
    joinedDate: '2022-01-15',
  };

  const guardian = {
    name: 'Mary Kamau',
    relationship: 'Mother',
    phone: '+254 722 987 654',
    email: 'mary.kamau@email.com',
    address: 'Nairobi, Kenya',
  };

  return (
    <BeneficiaryLayout title="My Profile" subtitle="View and manage your personal information">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src="/api/placeholder/100/100" />
              <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-700">JM</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-slate-500">{profile.admissionNumber}</p>
            <Badge className="mt-3 bg-emerald-100 text-emerald-700">{profile.sponsorshipStatus}</Badge>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <GraduationCap className="w-5 h-5" />
                <span>{profile.school}</span>
              </div>
              <p className="text-slate-500 mt-1">{profile.class}</p>
            </div>
            <Button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Phone className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900">{profile.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Address</p>
                    <p className="font-medium text-slate-900">{profile.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date of Birth</p>
                    <p className="font-medium text-slate-900">{profile.dateOfBirth}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="font-medium text-slate-900">{guardian.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Relationship</p>
                  <p className="font-medium text-slate-900">{guardian.relationship}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium text-slate-900">{guardian.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">{guardian.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsorship Details */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                Sponsorship Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <p className="text-sm text-emerald-600">Status</p>
                  <Badge className="mt-2 bg-emerald-100 text-emerald-700">{profile.sponsorshipStatus}</Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Joined Program</p>
                  <p className="font-bold text-slate-900 mt-1">{profile.joinedDate}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Years in Program</p>
                  <p className="font-bold text-slate-900 mt-1">2 Years</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BeneficiaryLayout>
  );
};

export default PortalProfile;
