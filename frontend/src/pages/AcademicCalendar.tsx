import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  GraduationCap,
  PartyPopper,
  BookOpen,
  AlertCircle
} from 'lucide-react';

const AcademicCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const events = [
    { id: 1, title: 'Term 1 Begins', date: 'Jan 8, 2024', type: 'academic', icon: BookOpen, color: 'bg-blue-500' },
    { id: 2, title: 'Parent-Teacher Meeting', date: 'Jan 20, 2024', time: '9:00 AM - 1:00 PM', type: 'meeting', icon: Users, color: 'bg-purple-500' },
    { id: 3, title: 'Mid-Term Exams', date: 'Feb 12-16, 2024', type: 'exam', icon: GraduationCap, color: 'bg-orange-500' },
    { id: 4, title: 'Sports Day', date: 'Mar 1, 2024', time: '8:00 AM - 4:00 PM', type: 'event', icon: PartyPopper, color: 'bg-green-500' },
    { id: 5, title: 'Term 1 Exams', date: 'Mar 15-22, 2024', type: 'exam', icon: GraduationCap, color: 'bg-red-500' },
    { id: 6, title: 'Term 1 Closing', date: 'Apr 5, 2024', type: 'holiday', icon: PartyPopper, color: 'bg-pink-500' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Science Fair', date: 'Mar 25, 2024', location: 'Main Hall', attendees: 150 },
    { id: 2, title: 'Career Day', date: 'Mar 28, 2024', location: 'Auditorium', attendees: 200 },
    { id: 3, title: 'Cultural Day', date: 'Apr 2, 2024', location: 'School Grounds', attendees: 500 },
  ];

  const academicTerms = [
    { term: 'Term 1', start: 'Jan 8, 2024', end: 'Apr 5, 2024', weeks: 13, status: 'Active' },
    { term: 'Term 2', start: 'Apr 29, 2024', end: 'Aug 2, 2024', weeks: 14, status: 'Upcoming' },
    { term: 'Term 3', start: 'Aug 26, 2024', end: 'Nov 22, 2024', weeks: 13, status: 'Upcoming' },
  ];

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'academic':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Academic</Badge>;
      case 'exam':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Examination</Badge>;
      case 'meeting':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Meeting</Badge>;
      case 'event':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Event</Badge>;
      case 'holiday':
        return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">Holiday</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Academic Calendar" subtitle="View and manage academic events, terms, and important dates">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                  Calendar
                </CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border pointer-events-auto"
                />
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div className={`w-12 h-12 rounded-lg ${event.color} flex items-center justify-center mr-4`}>
                      <event.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{event.title}</h4>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {event.date}
                        {event.time && (
                          <>
                            <Clock className="w-4 h-4 ml-3 mr-1" />
                            {event.time}
                          </>
                        )}
                      </div>
                    </div>
                    {getEventTypeBadge(event.type)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Academic Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                Academic Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {academicTerms.map((term, index) => (
                  <div key={index} className="p-4 rounded-lg bg-slate-50 border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{term.term}</h4>
                      <Badge variant={term.status === 'Active' ? 'default' : 'outline'}>
                        {term.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>{term.start} - {term.end}</p>
                      <p className="text-slate-500">{term.weeks} weeks</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm text-slate-700">Total Events</span>
                  </div>
                  <span className="font-bold text-blue-600">8</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <div className="flex items-center">
                    <GraduationCap className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm text-slate-700">Exams</span>
                  </div>
                  <span className="font-bold text-red-600">2</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-sm text-slate-700">Meetings</span>
                  </div>
                  <span className="font-bold text-purple-600">3</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center">
                    <PartyPopper className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm text-slate-700">Events</span>
                  </div>
                  <span className="font-bold text-green-600">3</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-3"></div>
                Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Report Cards Due</p>
                    <p className="text-xs text-slate-600">Submit by Mar 25</p>
                  </div>
                </div>
                <div className="flex items-start p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Fee Collection</p>
                    <p className="text-xs text-slate-600">Deadline: Apr 1</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AcademicCalendar;
