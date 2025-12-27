import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Plus, 
  Send,
  Mail,
  MessageSquare,
  Bell,
  Users,
  Megaphone,
  Star,
  Trash2,
  Archive,
  MoreHorizontal,
  Paperclip,
  Clock
} from 'lucide-react';

const Communication = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<number | null>(1);

  const stats = [
    { title: 'Total Messages', value: '1,234', icon: MessageSquare, color: 'bg-blue-500' },
    { title: 'Unread', value: '23', icon: Mail, color: 'bg-orange-500' },
    { title: 'Announcements', value: '45', icon: Megaphone, color: 'bg-purple-500' },
    { title: 'Contacts', value: '856', icon: Users, color: 'bg-green-500' },
  ];

  const messages = [
    { 
      id: 1, 
      sender: 'Jane Muthoni', 
      subject: 'Request for Fee Statement', 
      preview: 'Dear Admin, I would like to request a fee statement for my child...', 
      time: '10:30 AM',
      unread: true,
      starred: true 
    },
    { 
      id: 2, 
      sender: 'Kevin Ochieng\'s Parent', 
      subject: 'Inquiry about Scholarship', 
      preview: 'Hello, I wanted to inquire about the scholarship application process...', 
      time: '9:15 AM',
      unread: true,
      starred: false 
    },
    { 
      id: 3, 
      sender: 'Grace Wanjiku', 
      subject: 'Thank You Note', 
      preview: 'I wanted to express my sincere gratitude for the support...', 
      time: 'Yesterday',
      unread: false,
      starred: true 
    },
    { 
      id: 4, 
      sender: 'School Principal', 
      subject: 'Term 1 Report', 
      preview: 'Please find attached the term 1 performance report for your review...', 
      time: 'Yesterday',
      unread: false,
      starred: false 
    },
    { 
      id: 5, 
      sender: 'Finance Department', 
      subject: 'Payment Confirmation', 
      preview: 'This is to confirm that we have received your payment of KES 45,000...', 
      time: 'Mar 8',
      unread: false,
      starred: false 
    },
  ];

  const announcements = [
    { id: 1, title: 'Term 1 Examinations Schedule', date: 'Mar 10, 2024', audience: 'All Students', status: 'Published' },
    { id: 2, title: 'Sports Day Registration Open', date: 'Mar 8, 2024', audience: 'All Students', status: 'Published' },
    { id: 3, title: 'Parent-Teacher Meeting Reminder', date: 'Mar 5, 2024', audience: 'Parents', status: 'Published' },
    { id: 4, title: 'Holiday Notice - Easter Break', date: 'Mar 1, 2024', audience: 'All', status: 'Draft' },
  ];

  const selectedMessageData = messages.find(m => m.id === selectedMessage);

  return (
    <DashboardLayout title="Communication" subtitle="Manage messages, announcements, and notifications">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Messages</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input 
                    placeholder="Search messages..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      onClick={() => setSelectedMessage(message.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedMessage === message.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                      } ${message.unread ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="flex items-start">
                        <Avatar className="w-10 h-10 mr-3">
                          <AvatarFallback>{message.sender.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium text-sm truncate ${message.unread ? 'text-slate-900' : 'text-slate-700'}`}>
                              {message.sender}
                            </p>
                            <span className="text-xs text-slate-500">{message.time}</span>
                          </div>
                          <p className={`text-sm truncate ${message.unread ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                            {message.subject}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-1">{message.preview}</p>
                        </div>
                        {message.starred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-2" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message Detail */}
            <Card className="lg:col-span-2">
              {selectedMessageData ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="w-12 h-12 mr-4">
                          <AvatarFallback>{selectedMessageData.sender.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{selectedMessageData.subject}</h3>
                          <p className="text-sm text-slate-600">From: {selectedMessageData.sender}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Star className={`w-4 h-4 ${selectedMessageData.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center text-sm text-slate-500 mb-6">
                      <Clock className="w-4 h-4 mr-1" />
                      {selectedMessageData.time}
                    </div>
                    <div className="prose max-w-none">
                      <p>Dear Admin,</p>
                      <p className="mt-4">
                        I hope this message finds you well. I am writing to request a detailed fee statement 
                        for my child, Jane Muthoni, who is currently in Form 2.
                      </p>
                      <p className="mt-4">
                        I need this statement for my records and to verify the payments I have made this term. 
                        Kindly also include any pending balances if applicable.
                      </p>
                      <p className="mt-4">
                        Thank you for your assistance.
                      </p>
                      <p className="mt-4">
                        Best regards,<br />
                        Mrs. Muthoni
                      </p>
                    </div>

                    {/* Reply Section */}
                    <div className="mt-8 pt-6 border-t">
                      <h4 className="font-medium mb-4">Reply</h4>
                      <Textarea placeholder="Type your reply here..." className="mb-4" rows={4} />
                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm">
                          <Paperclip className="w-4 h-4 mr-2" />
                          Attach File
                        </Button>
                        <Button>
                          <Send className="w-4 h-4 mr-2" />
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-12 text-center text-slate-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a message to view</p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Announcements</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Announcement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="flex items-center p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mr-4">
                      <Megaphone className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{announcement.title}</h4>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <span>{announcement.date}</span>
                        <span className="mx-2">•</span>
                        <span>{announcement.audience}</span>
                      </div>
                    </div>
                    <Badge variant={announcement.status === 'Published' ? 'default' : 'outline'}>
                      {announcement.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">To</label>
                  <Input placeholder="Select recipients..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                  <Input placeholder="Enter subject..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                  <Textarea placeholder="Type your message here..." rows={8} />
                </div>
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach Files
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="outline">Save as Draft</Button>
                    <Button>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Communication;
