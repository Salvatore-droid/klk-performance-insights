import React, { useState } from 'react';
import BeneficiaryLayout from '@/components/layout/BeneficiaryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Send,
  Inbox,
  Clock,
  CheckCheck,
  PenSquare
} from 'lucide-react';
import { toast } from 'sonner';

const PortalMessages = () => {
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');

  const messages = [
    { id: 1, from: 'Admin Office', subject: 'Fee Statement Received', preview: 'Thank you for submitting your fee statement...', date: '2024-01-20', read: true, type: 'received' },
    { id: 2, from: 'Financial Aid', subject: 'Scholarship Update', preview: 'Your scholarship application has been approved...', date: '2024-01-18', read: true, type: 'received' },
    { id: 3, from: 'You', subject: 'Document Inquiry', preview: 'I would like to inquire about the required documents...', date: '2024-01-15', read: true, type: 'sent' },
    { id: 4, from: 'Academic Office', subject: 'Report Card Available', preview: 'Your Term 1 2024 report card is now available...', date: '2024-01-12', read: false, type: 'received' },
    { id: 5, from: 'You', subject: 'Fee Balance Query', preview: 'I have a question regarding my outstanding balance...', date: '2024-01-10', read: true, type: 'sent' },
  ];

  const handleSendMessage = () => {
    if (!recipient || !subject || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Message sent successfully!');
    setShowCompose(false);
    setSubject('');
    setMessage('');
    setRecipient('');
  };

  return (
    <BeneficiaryLayout title="Messages" subtitle="Communicate with the management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Inbox className="w-5 h-5 text-emerald-600" />
                Inbox
              </CardTitle>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowCompose(true)}
              >
                <PenSquare className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      msg.read ? 'bg-slate-50 hover:bg-slate-100' : 'bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${!msg.read ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {msg.from}
                          </p>
                          {msg.type === 'sent' && (
                            <CheckCheck className="w-4 h-4 text-emerald-500" />
                          )}
                          {!msg.read && (
                            <Badge className="bg-emerald-500 text-white text-xs">New</Badge>
                          )}
                        </div>
                        <p className={`text-sm ${!msg.read ? 'font-medium text-slate-800' : 'text-slate-700'}`}>
                          {msg.subject}
                        </p>
                        <p className="text-sm text-slate-500 mt-1 truncate">{msg.preview}</p>
                      </div>
                      <div className="flex items-center text-xs text-slate-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {msg.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compose Message */}
        <div>
          {showCompose ? (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" />
                  New Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>To</Label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin Office</SelectItem>
                      <SelectItem value="financial">Financial Aid Office</SelectItem>
                      <SelectItem value="academic">Academic Office</SelectItem>
                      <SelectItem value="support">Support Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSendMessage}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowCompose(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-700">Quick Actions</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-4">
                    Send a message to the management team
                  </p>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setShowCompose(true)}
                  >
                    <PenSquare className="w-4 h-4 mr-2" />
                    Compose Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Contact */}
          <Card className="border-0 shadow-md mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700">Admin Office</p>
                  <p className="text-slate-500">admin@klk.org</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Financial Aid</p>
                  <p className="text-slate-500">finance@klk.org</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Support</p>
                  <p className="text-slate-500">support@klk.org</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BeneficiaryLayout>
  );
};

export default PortalMessages;
