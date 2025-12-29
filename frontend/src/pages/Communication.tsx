import React, { useState, useEffect } from 'react';
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
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  User,
  AlertTriangle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Message {
  id: number;
  subject: string;
  content: string;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  recipient: {
    id: number;
    name: string;
    email: string;
  };
  is_read: boolean;
  sent_at: string;
  relative_time: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  relative_time: string;
  related_object_id: number | null;
  related_object_type: string | null;
}

interface Beneficiary {
  id: number;
  full_name: string;
  email: string;
  profile_image_url: string | null;
}

const Communication = () => {
  const { apiRequest, user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Compose message state
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [recipientId, setRecipientId] = useState<string>('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState('general');
  const [messagePriority, setMessagePriority] = useState('normal');
  
  // Stats
  const [stats, setStats] = useState({
    total_messages: 0,
    unread_messages: 0,
    total_notifications: 0,
    unread_notifications: 0,
    total_beneficiaries: 0
  });

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const { data, error } = await apiRequest('/admin/beneficiaries/?limit=1');
      
      if (error) throw new Error(error);
      
      if (data?.success) {
        // We'll use a placeholder for now since we need a dedicated messages endpoint
        // For now, we'll show admin notifications as messages
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const { data, error } = await apiRequest('/admin/notifications/');
      
      if (error) throw new Error(error);
      
      if (data?.success) {
        setNotifications(data.notifications || []);
        setStats(prev => ({
          ...prev,
          total_notifications: data.notifications?.length || 0,
          unread_notifications: data.unread_count || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch beneficiaries for recipient selection
  const fetchBeneficiaries = async () => {
    try {
      setLoadingRecipients(true);
      const { data, error } = await apiRequest('/admin/beneficiaries/?limit=50');
      
      if (error) throw new Error(error);
      
      if (data?.success) {
        setBeneficiaries(data.beneficiaries || []);
        setStats(prev => ({
          ...prev,
          total_beneficiaries: data.pagination?.total_count || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId: number) => {
    try {
      const { data, error } = await apiRequest(`/admin/notifications/${notificationId}/read/`, {
        method: 'POST'
      });
      
      if (error) throw new Error(error);
      
      if (data?.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setStats(prev => ({
          ...prev,
          unread_notifications: Math.max(0, prev.unread_notifications - 1)
        }));
      }
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      const { data, error } = await apiRequest('/admin/notifications/?mark_all_read=true');
      
      if (error) throw new Error(error);
      
      if (data?.success) {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        setStats(prev => ({
          ...prev,
          unread_notifications: 0
        }));
        
        toast({
          title: 'Success',
          description: 'All notifications marked as read.',
        });
      }
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!recipientId || !messageSubject || !messageContent) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSendingMessage(true);
      
      const { data, error } = await apiRequest('/admin/messages/send/', {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: parseInt(recipientId),
          subject: messageSubject,
          content: messageContent
        })
      });

      if (error) throw new Error(error);

      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Message sent successfully.',
        });
        
        // Reset form
        setRecipientId('');
        setMessageSubject('');
        setMessageContent('');
        setMessageType('general');
        setMessagePriority('normal');
        setComposeDialogOpen(false);
        
        // Refresh messages
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchMessages();
    fetchNotifications();
    fetchBeneficiaries();
  }, []);

  // Filter notifications based on search
  const filteredNotifications = notifications.filter(notif => 
    notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter beneficiaries for recipient selection
  const filteredBeneficiaries = beneficiaries.filter(beneficiary =>
    beneficiary.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    beneficiary.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statsCards = [
    { 
      title: 'Total Messages', 
      value: stats.total_notifications.toString(), 
      icon: MessageSquare, 
      color: 'bg-blue-500',
      loading: loadingNotifications
    },
    { 
      title: 'Unread', 
      value: stats.unread_notifications.toString(), 
      icon: Mail, 
      color: 'bg-orange-500',
      loading: loadingNotifications
    },
    { 
      title: 'Announcements', 
      value: notifications.filter(n => n.type === 'system').length.toString(), 
      icon: Megaphone, 
      color: 'bg-purple-500',
      loading: loadingNotifications
    },
    { 
      title: 'Contacts', 
      value: stats.total_beneficiaries.toString(), 
      icon: Users, 
      color: 'bg-green-500',
      loading: loadingRecipients
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <Paperclip className="w-5 h-5" />;
      case 'payment':
        return <CheckCircle className="w-5 h-5" />;
      case 'system':
        return <Megaphone className="w-5 h-5" />;
      case 'message':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100 text-blue-600';
      case 'payment':
        return 'bg-green-100 text-green-600';
      case 'system':
        return 'bg-purple-100 text-purple-600';
      case 'message':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationAction = (notification: Notification) => {
    if (notification.related_object_id && notification.related_object_type) {
      switch (notification.related_object_type) {
        case 'Document':
          // Navigate to document review
          toast({
            title: 'Opening Document',
            description: `Opening document #${notification.related_object_id}`,
          });
          break;
        case 'Payment':
          // Navigate to payment review
          toast({
            title: 'Opening Payment',
            description: `Opening payment #${notification.related_object_id}`,
          });
          break;
        default:
          toast({
            title: 'Action',
            description: `Processing ${notification.related_object_type}`,
          });
      }
    }
  };

  return (
    <DashboardLayout 
      title="Communication" 
      subtitle="Manage messages, announcements, and notifications"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm mb-1">{stat.title}</p>
                  {stat.loading ? (
                    <div className="h-8 flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Messages</CardTitle>
                  <Button size="sm" onClick={() => setComposeDialogOpen(true)}>
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
                {loadingNotifications ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages found</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {filteredNotifications.map((notification) => (
                      <div 
                        key={notification.id}
                        onClick={() => {
                          markNotificationRead(notification.id);
                          // For now, we'll use notifications as messages
                        }}
                        className={`p-4 cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium text-sm truncate ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                                {notification.title}
                              </p>
                              <span className="text-xs text-slate-500">{notification.relative_time}</span>
                            </div>
                            <p className="text-sm text-slate-600 truncate mt-1">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.type}
                              </Badge>
                              {!notification.is_read && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Detail */}
            <Card className="lg:col-span-2">
              <CardContent className="p-12 text-center text-slate-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Message Center</h3>
                <p className="mb-4">Select a message to view details or compose a new message.</p>
                <Button onClick={() => setComposeDialogOpen(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Compose New Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center">
                  System Notifications
                  {stats.unread_notifications > 0 && (
                    <Badge className="ml-3 bg-orange-100 text-orange-800">
                      {stats.unread_notifications} unread
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input 
                      placeholder="Search notifications..." 
                      className="pl-10 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={markAllNotificationsRead}
                    disabled={stats.unread_notifications === 0}
                  >
                    Mark all as read
                  </Button>
                  <Button variant="outline" size="icon" onClick={fetchNotifications}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {loadingNotifications ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No notifications found</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {searchQuery ? 'Try a different search term' : 'You\'re all caught up!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        !notification.is_read 
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                {notification.title}
                                {!notification.is_read && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>
                                )}
                              </h4>
                              <p className="text-sm text-slate-600 mt-2">{notification.message}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => markNotificationRead(notification.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as read
                                </DropdownMenuItem>
                                {notification.related_object_id && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleNotificationAction(notification)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View related item
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center text-sm text-slate-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(notification.created_at)}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {notification.type}
                              </Badge>
                            </div>
                            
                            {notification.related_object_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNotificationAction(notification)}
                              >
                                Take Action
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="recipient">To</Label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingRecipients ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading beneficiaries...
                        </div>
                      ) : beneficiaries.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">
                          No beneficiaries found
                        </div>
                      ) : (
                        beneficiaries.map((beneficiary) => (
                          <SelectItem key={beneficiary.id} value={beneficiary.id.toString()}>
                            <div className="flex items-center">
                              <Avatar className="w-6 h-6 mr-2">
                                <AvatarImage src={beneficiary.profile_image_url || undefined} />
                                <AvatarFallback>
                                  {beneficiary.full_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{beneficiary.full_name}</span>
                              <span className="text-slate-500 ml-2">({beneficiary.email})</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500 mt-2">
                    Select a beneficiary to send a message to
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter message subject..."
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Message Type</Label>
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="financial">Financial Aid</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="document">Document Related</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={messagePriority} onValueChange={setMessagePriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    rows={8}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button variant="outline">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach Files
                  </Button>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setRecipientId('');
                        setMessageSubject('');
                        setMessageContent('');
                        setMessageType('general');
                        setMessagePriority('normal');
                      }}
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !recipientId || !messageSubject || !messageContent}
                    >
                      {sendingMessage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compose Dialog (for quick compose from inbox) */}
      <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Compose New Message</DialogTitle>
            <DialogDescription>
              Send a message to a beneficiary.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="dialog-recipient">Recipient</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient..." />
                </SelectTrigger>
                <SelectContent>
                  {beneficiaries.map((beneficiary) => (
                    <SelectItem key={beneficiary.id} value={beneficiary.id.toString()}>
                      <div className="flex items-center">
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarImage src={beneficiary.profile_image_url || undefined} />
                          <AvatarFallback>
                            {beneficiary.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{beneficiary.full_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dialog-subject">Subject</Label>
              <Input
                id="dialog-subject"
                placeholder="Enter message subject..."
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="dialog-message">Message</Label>
              <Textarea
                id="dialog-message"
                placeholder="Type your message here..."
                rows={4}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setComposeDialogOpen(false);
                setRecipientId('');
                setMessageSubject('');
                setMessageContent('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !recipientId || !messageSubject || !messageContent}
            >
              {sendingMessage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Communication;
