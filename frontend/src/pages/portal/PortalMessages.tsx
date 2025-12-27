import React, { useState, useEffect } from 'react';
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
  PenSquare,
  Loader2,
  RefreshCw,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ArrowLeft,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/use-media-query';

interface Message {
  id: number;
  subject: string;
  content: string;
  sender: {
    email: string;
    full_name: string;
  };
  is_read: boolean;
  sent_at: string;
  type?: 'sent' | 'received';
}

const PortalMessages = () => {
  const { apiRequest } = useAuth();
  const { toast: uiToast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('admin');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageDetail, setShowMessageDetail] = useState(false);

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiRequest('/messages/');
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.success) {
        const messagesWithType = data.messages.map((msg: Message) => ({
          ...msg,
          type: 'received'
        }));
        setMessages(messagesWithType);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      uiToast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!subject || !message) {
      toast.error('Subject and message are required');
      return;
    }

    try {
      setSending(true);
      const { data, error } = await apiRequest('/messages/send/', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          content: message,
          recipient_type: recipient
        })
      });

      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        toast.success('Message sent successfully!');
        setShowCompose(false);
        setSubject('');
        setMessage('');
        setRecipient('admin');
        
        fetchMessages();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      const { data, error } = await apiRequest(`/messages/${messageId}/read/`, {
        method: 'POST'
      });

      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        setMessages(messages.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        ));
        
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, is_read: true });
        }
        
        toast.success('Message marked as read');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    }
  };

  const handleRefreshMessages = async () => {
    try {
      setRefreshing(true);
      await fetchMessages();
      toast.success('Messages refreshed');
    } catch (error) {
      console.error('Error refreshing messages:', error);
      toast.error('Failed to refresh messages');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const { data, error } = await apiRequest(`/messages/${messageId}/delete/`, {
        method: 'DELETE'
      });

      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        setMessages(messages.filter(msg => msg.id !== messageId));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
          setShowMessageDetail(false);
        }
        toast.success('Message deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleViewMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (isMobile || isTablet) {
      setShowMessageDetail(true);
    }
    
    if (!msg.is_read) {
      handleMarkAsRead(msg.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getMessagePreview = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <BeneficiaryLayout title="Messages" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-slate-600">Loading messages...</p>
          </div>
        </div>
      </BeneficiaryLayout>
    );
  }

  return (
    <BeneficiaryLayout title="Messages" subtitle="Communicate with the management">
      {/* Mobile/Tablet: Single Column Layout */}
      {(isMobile || isTablet) && (
        <div className="space-y-6">
          {/* Header with Actions */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-lg">Inbox</CardTitle>
                <Badge variant="outline" className="ml-2">
                  {messages.length}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshMessages}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="sr-only md:not-sr-only md:ml-2">Refresh</span>
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                  onClick={() => setShowCompose(true)}
                >
                  <PenSquare className="w-4 h-4" />
                  <span className="sr-only md:not-sr-only md:ml-2">Compose</span>
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Messages List */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 mb-2">No messages yet</h3>
                  <p className="text-slate-500 mb-4 text-sm">
                    Your inbox is empty. Start a conversation!
                  </p>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setShowCompose(true)}
                  >
                    <PenSquare className="w-4 h-4 mr-2" />
                    Compose First Message
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedMessage?.id === msg.id 
                          ? 'bg-emerald-50 border border-emerald-200' 
                          : msg.is_read 
                            ? 'bg-slate-50 hover:bg-slate-100' 
                            : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                      onClick={() => handleViewMessage(msg)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className={`font-medium text-sm truncate ${
                              selectedMessage?.id === msg.id 
                                ? 'text-emerald-900' 
                                : !msg.is_read 
                                  ? 'text-blue-900' 
                                  : 'text-slate-900'
                            }`}>
                              {msg.sender.full_name || msg.sender.email}
                            </p>
                            {!msg.is_read && (
                              <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                            )}
                          </div>
                          <p className={`text-sm font-medium truncate ${
                            selectedMessage?.id === msg.id 
                              ? 'text-emerald-800' 
                              : !msg.is_read 
                                ? 'text-blue-800' 
                                : 'text-slate-800'
                          }`}>
                            {msg.subject}
                          </p>
                          <p className="text-xs text-slate-600 mt-1 truncate">
                            {getMessagePreview(msg.content, 50)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center text-xs text-slate-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(msg.sent_at)}
                          </div>
                          <div className="flex gap-1">
                            {!msg.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(msg.id);
                                }}
                                title="Mark as read"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this message?')) {
                                  handleDeleteMessage(msg.id);
                                }
                              }}
                              title="Delete message"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-slate-600 mb-1">Total</p>
                <p className="text-xl font-bold text-slate-900">{messages.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-blue-600 mb-1">Unread</p>
                <p className="text-xl font-bold text-blue-700">
                  {messages.filter(m => !m.is_read).length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-emerald-600 mb-1">Read</p>
                <p className="text-xl font-bold text-emerald-700">
                  {messages.filter(m => m.is_read).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Contact */}
          <Card className="border-0 shadow-md">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Quick Contact</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="font-medium text-slate-700 text-sm">Admin</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <p className="text-xs text-slate-500">admin@klk.org</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="font-medium text-slate-700 text-sm">Finance</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <p className="text-xs text-slate-500">finance@klk.org</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="font-medium text-slate-700 text-sm">Academic</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <p className="text-xs text-slate-500">academics@klk.org</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="font-medium text-slate-700 text-sm">Support</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <p className="text-xs text-slate-500">support@klk.org</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Floating Action Button for Mobile */}
          {isMobile && !showCompose && (
            <div className="fixed bottom-6 right-6 z-10">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 rounded-full w-14 h-14 shadow-lg"
                onClick={() => setShowCompose(true)}
              >
                <PenSquare className="w-6 h-6" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Desktop: Three Column Layout */}
      {!isMobile && !isTablet && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List - 2 columns on desktop */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg">Inbox</CardTitle>
                  <Badge variant="outline" className="ml-2">
                    {messages.length} messages
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefreshMessages}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setShowCompose(true)}
                  >
                    <PenSquare className="w-4 h-4 mr-2" />
                    Compose
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">No messages yet</h3>
                    <p className="text-slate-500 mb-4">
                      Your inbox is empty. Start a conversation!
                    </p>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setShowCompose(true)}
                    >
                      <PenSquare className="w-4 h-4 mr-2" />
                      Compose First Message
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedMessage?.id === msg.id 
                            ? 'bg-emerald-50 border border-emerald-200' 
                            : msg.is_read 
                              ? 'bg-slate-50 hover:bg-slate-100' 
                              : 'bg-blue-50 hover:bg-blue-100'
                        }`}
                        onClick={() => handleViewMessage(msg)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-medium ${
                                selectedMessage?.id === msg.id 
                                  ? 'text-emerald-900' 
                                  : !msg.is_read 
                                    ? 'text-blue-900' 
                                    : 'text-slate-900'
                              }`}>
                                {msg.sender.full_name || msg.sender.email}
                              </p>
                              {!msg.is_read && (
                                <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                              )}
                              {msg.is_read && (
                                <CheckCheck className="w-3 h-3 text-emerald-500" />
                              )}
                            </div>
                            <p className={`text-sm font-medium ${
                              selectedMessage?.id === msg.id 
                                ? 'text-emerald-800' 
                                : !msg.is_read 
                                  ? 'text-blue-800' 
                                  : 'text-slate-800'
                            }`}>
                              {msg.subject}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {getMessagePreview(msg.content)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center text-xs text-slate-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(msg.sent_at)}
                            </div>
                            <div className="flex gap-1">
                              {!msg.is_read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(msg.id);
                                  }}
                                  title="Mark as read"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this message?')) {
                                    handleDeleteMessage(msg.id);
                                  }
                                }}
                                title="Delete message"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Detail View */}
            {selectedMessage && (
              <Card className="border-0 shadow-md mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      From: {selectedMessage.sender.full_name || selectedMessage.sender.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMessage(null)}
                    >
                      Close
                    </Button>
                    {!selectedMessage.is_read && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsRead(selectedMessage.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="text-sm text-slate-500 mb-4">
                      Sent on {new Date(selectedMessage.sent_at).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap text-slate-700">
                      {selectedMessage.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Compose Message / Quick Actions - 1 column on desktop */}
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
                      disabled={sending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={6}
                      disabled={sending}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleSendMessage}
                      disabled={sending || !subject.trim() || !message.trim()}
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowCompose(false)}
                      disabled={sending}
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
                      className="w-full bg-emerald-600 hover:bg-emerald-700 mb-3"
                      onClick={() => setShowCompose(true)}
                    >
                      <PenSquare className="w-4 h-4 mr-2" />
                      Compose Message
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={handleRefreshMessages}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh Messages
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card className="border-0 shadow-md mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Message Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Messages</span>
                    <Badge>{messages.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Unread</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {messages.filter(m => !m.is_read).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Read</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                      {messages.filter(m => m.is_read).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <p className="font-medium text-slate-700">Academic Office</p>
                    <p className="text-slate-500">academics@klk.org</p>
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
      )}

      {/* Dialogs for Mobile/Tablet */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              New Message
            </DialogTitle>
            <DialogDescription>
              Send a message to the management team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={6}
                disabled={sending}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSendMessage}
                disabled={sending || !subject.trim() || !message.trim()}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowCompose(false)}
                disabled={sending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMessageDetail} onOpenChange={setShowMessageDetail}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMessage.subject}</DialogTitle>
                <DialogDescription>
                  From: {selectedMessage.sender.full_name || selectedMessage.sender.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-slate-500">
                  Sent on {new Date(selectedMessage.sent_at).toLocaleString()}
                </div>
                <div className="whitespace-pre-wrap text-slate-700 border-t pt-4">
                  {selectedMessage.content}
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  {!selectedMessage.is_read && (
                    <Button
                      size="sm"
                      onClick={() => {
                        handleMarkAsRead(selectedMessage.id);
                        setShowMessageDetail(false);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Delete this message?')) {
                        handleDeleteMessage(selectedMessage.id);
                        setShowMessageDetail(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </BeneficiaryLayout>
  );
};

export default PortalMessages;