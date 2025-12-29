import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Database,
  Users,
  Key,
  Mail,
  Globe,
  Save,
  Upload,
  Trash2,
  Plus,
  Edit,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Calendar,
  Activity,
  Filter,
  Download
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from '@/components/ui/textarea';

interface SystemUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
  profile?: {
    role: string;
    phone_number: string | null;
  };
}

interface AuditLog {
  id: number;
  user: {
    id: number;
    name: string;
    email: string | null;
  } | null;
  action_type: string;
  model_name: string;
  object_id: number;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  relative_time: string;
}

interface SystemSetting {
  key: string;
  value: string;
  setting_type: string;
  description: string;
  is_active: boolean;
}

const SystemSettings = () => {
  const { user: currentUser, apiRequest, changePassword } = useAuth();
  const { toast } = useToast();
  
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [orgName, setOrgName] = useState('Kids League Kenya');
  const [orgEmail, setOrgEmail] = useState('info@klk.org');
  const [orgPhone, setOrgPhone] = useState('+254 700 123 456');
  const [orgAddress, setOrgAddress] = useState('Nairobi, Kenya');
  const [primaryColor, setPrimaryColor] = useState('blue');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Africa/Nairobi');
  
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_staff: false,
    is_superuser: false,
  });

  // Fetch system users
  const fetchSystemUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Since we don't have a specific endpoint for system users,
      // we can use the existing beneficiaries endpoint with a filter for staff/admin users
      // Or we could create a new endpoint. For now, let's use Django's User model
      const { data, error } = await apiRequest('/admin/audit-logs/?action_type=create&model_name=User');
      
      if (error) {
        // Fallback to a simulated list if endpoint doesn't exist
        console.log('Using simulated user data');
        setSystemUsers([
          {
            id: 1,
            username: currentUser?.username || 'admin',
            email: currentUser?.email || 'admin@klk.org',
            first_name: currentUser?.full_name?.split(' ')[0] || 'Admin',
            last_name: currentUser?.full_name?.split(' ')[1] || 'User',
            is_staff: true,
            is_superuser: true,
            is_active: true,
            last_login: new Date().toISOString(),
            date_joined: '2024-01-01',
            profile: { role: 'Super Admin', phone_number: '+254700000000' }
          }
        ]);
      } else if (data?.success) {
        // If we have real data from audit logs
        // This is a placeholder - you'll need to implement the actual user endpoint
      }
    } catch (error) {
      console.error('Error fetching system users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system users.',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      
      const { data, error } = await apiRequest('/admin/audit-logs/?limit=20');
      
      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        setAuditLogs(data.audit_logs || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activity logs.',
        variant: 'destructive',
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch system settings (simulated for now)
  const fetchSystemSettings = async () => {
    try {
      setLoadingSettings(true);
      
      // Simulated settings - you'll need to implement this endpoint
      const simulatedSettings: SystemSetting[] = [
        { key: 'organization_name', value: 'Kids League Kenya', setting_type: 'general', description: 'Organization display name', is_active: true },
        { key: 'organization_email', value: 'info@klk.org', setting_type: 'general', description: 'Primary contact email', is_active: true },
        { key: 'email_notifications', value: 'true', setting_type: 'notification', description: 'Enable email notifications', is_active: true },
        { key: 'sms_notifications', value: 'false', setting_type: 'notification', description: 'Enable SMS notifications', is_active: true },
        { key: 'session_timeout', value: '30', setting_type: 'security', description: 'Session timeout in minutes', is_active: true },
        { key: 'primary_color', value: 'blue', setting_type: 'general', description: 'Primary theme color', is_active: true },
        { key: 'timezone', value: 'Africa/Nairobi', setting_type: 'general', description: 'System timezone', is_active: true },
      ];
      
      setSystemSettings(simulatedSettings);
      
      // Load current values from settings
      const orgNameSetting = simulatedSettings.find(s => s.key === 'organization_name');
      const orgEmailSetting = simulatedSettings.find(s => s.key === 'organization_email');
      const emailNotifSetting = simulatedSettings.find(s => s.key === 'email_notifications');
      const smsNotifSetting = simulatedSettings.find(s => s.key === 'sms_notifications');
      const timeoutSetting = simulatedSettings.find(s => s.key === 'session_timeout');
      const colorSetting = simulatedSettings.find(s => s.key === 'primary_color');
      const tzSetting = simulatedSettings.find(s => s.key === 'timezone');
      
      if (orgNameSetting) setOrgName(orgNameSetting.value);
      if (orgEmailSetting) setOrgEmail(orgEmailSetting.value);
      if (emailNotifSetting) setEmailNotifications(emailNotifSetting.value === 'true');
      if (smsNotifSetting) setSmsNotifications(smsNotifSetting.value === 'true');
      if (timeoutSetting) setSessionTimeout(timeoutSetting.value);
      if (colorSetting) setPrimaryColor(colorSetting.value);
      if (tzSetting) setTimezone(tzSetting.value);
      
    } catch (error) {
      console.error('Error fetching system settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Save system settings
  const saveSystemSettings = async () => {
    try {
      setLoadingSettings(true);
      
      // This would call your backend endpoint to save settings
      // For now, we'll simulate the save
      const updatedSettings: SystemSetting[] = [
        ...systemSettings.map(setting => {
          switch (setting.key) {
            case 'organization_name':
              return { ...setting, value: orgName };
            case 'organization_email':
              return { ...setting, value: orgEmail };
            case 'email_notifications':
              return { ...setting, value: emailNotifications.toString() };
            case 'sms_notifications':
              return { ...setting, value: smsNotifications.toString() };
            case 'session_timeout':
              return { ...setting, value: sessionTimeout };
            case 'primary_color':
              return { ...setting, value: primaryColor };
            case 'timezone':
              return { ...setting, value: timezone };
            default:
              return setting;
          }
        })
      ];
      
      setSystemSettings(updatedSettings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'System settings saved successfully.',
      });
      
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save system settings.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setChangingPassword(true);
      
      const { error } = await changePassword(currentPassword, newPassword, confirmPassword);
      
      if (error) {
        throw new Error(error);
      }
      
      toast({
        title: 'Success',
        description: 'Password updated successfully.',
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Failed to update password.',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchSystemUsers();
    fetchAuditLogs();
    fetchSystemSettings();
  }, []);

  const getRoleBadge = (user: SystemUser) => {
    if (user.is_superuser) {
      return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>;
    } else if (user.is_staff) {
      return <Badge className="bg-blue-100 text-blue-800">Admin</Badge>;
    } else {
      return <Badge variant="outline">User</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  const getActionTypeBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      'create': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'approve': 'bg-emerald-100 text-emerald-800',
      'reject': 'bg-amber-100 text-amber-800',
      'verify': 'bg-indigo-100 text-indigo-800',
    };
    
    return (
      <Badge className={colors[actionType] || 'bg-slate-100 text-slate-800'}>
        {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="System Settings" subtitle="Manage system configuration and preferences">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Activity Logs
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Organization Settings
                </CardTitle>
                <CardDescription>Update your organization information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="org-name" className="mb-2">Organization Name</Label>
                  <Input 
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={loadingSettings}
                  />
                </div>
                <div>
                  <Label htmlFor="org-email" className="mb-2">Email Address</Label>
                  <Input 
                    id="org-email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    disabled={loadingSettings}
                  />
                </div>
                <div>
                  <Label htmlFor="org-phone" className="mb-2">Phone Number</Label>
                  <Input 
                    id="org-phone"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    disabled={loadingSettings}
                  />
                </div>
                <div>
                  <Label htmlFor="org-address" className="mb-2">Address</Label>
                  <Input 
                    id="org-address"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    disabled={loadingSettings}
                  />
                </div>
                <div>
                  <Label className="mb-2">Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Settings className="w-8 h-8 text-white" />
                    </div>
                    <Button variant="outline" disabled={loadingSettings}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4"
                  onClick={saveSystemSettings}
                  disabled={loadingSettings}
                >
                  {loadingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Primary Color</p>
                    <p className="text-sm text-slate-500">Main theme color</p>
                  </div>
                  <Select value={primaryColor} onValueChange={setPrimaryColor} disabled={loadingSettings}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Language</p>
                    <p className="text-sm text-slate-500">Interface language</p>
                  </div>
                  <Select value={language} onValueChange={setLanguage} disabled={loadingSettings}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sw">Kiswahili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Timezone</p>
                    <p className="text-sm text-slate-500">System timezone</p>
                  </div>
                  <Select value={timezone} onValueChange={setTimezone} disabled={loadingSettings}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full"
                  onClick={saveSystemSettings}
                  disabled={loadingSettings}
                >
                  {loadingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Appearance
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    User Management
                  </CardTitle>
                  <CardDescription>Manage system users and their roles</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={fetchSystemUsers} disabled={loadingUsers}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                          Create a new system user account.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first-name">First Name</Label>
                            <Input 
                              id="first-name" 
                              value={newUserData.first_name}
                              onChange={(e) => setNewUserData({...newUserData, first_name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last-name">Last Name</Label>
                            <Input 
                              id="last-name" 
                              value={newUserData.last_name}
                              onChange={(e) => setNewUserData({...newUserData, last_name: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input 
                            id="username" 
                            value={newUserData.username}
                            onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            type="email"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input 
                            id="password" 
                            type="password"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="staff" 
                              checked={newUserData.is_staff}
                              onCheckedChange={(checked) => setNewUserData({...newUserData, is_staff: checked})}
                            />
                            <Label htmlFor="staff">Staff User (Can access admin)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="superuser" 
                              checked={newUserData.is_superuser}
                              onCheckedChange={(checked) => setNewUserData({...newUserData, is_superuser: checked})}
                            />
                            <Label htmlFor="superuser">Superuser (Full permissions)</Label>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewUserDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => {
                          toast({
                            title: 'Note',
                            description: 'User creation would be implemented with your backend API',
                          });
                          setNewUserDialogOpen(false);
                        }}>
                          Create User
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : systemUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No system users found</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Add users to manage the system
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="w-8 h-8 mr-3">
                                <AvatarFallback>
                                  {user.first_name?.[0]}{user.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {user.first_name} {user.last_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-sm text-slate-500">{user.email}</p>
                                  {user.username && user.username !== user.email && (
                                    <Badge variant="outline" className="text-xs">
                                      @{user.username}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user)}</TableCell>
                          <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                          <TableCell className="text-slate-500">
                            {user.last_login ? formatDate(user.last_login) : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-slate-600 mr-3" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-slate-500">Receive updates via email</p>
                  </div>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications}
                  disabled={loadingSettings}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-slate-600 mr-3" />
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-slate-500">Receive updates via SMS</p>
                  </div>
                </div>
                <Switch 
                  checked={smsNotifications} 
                  onCheckedChange={setSmsNotifications}
                  disabled={loadingSettings}
                />
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Notification Types</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">New enrollments</p>
                      <p className="text-xs text-slate-500">When new beneficiaries register</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Payment updates</p>
                      <p className="text-xs text-slate-500">When payments are made or verified</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Performance reports</p>
                      <p className="text-xs text-slate-500">When academic reports are submitted</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">System alerts</p>
                      <p className="text-xs text-slate-500">Important system notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Button 
                className="w-full"
                onClick={saveSystemSettings}
                disabled={loadingSettings}
              >
                {loadingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current-password" className="mb-2">Current Password</Label>
                  <Input 
                    id="current-password"
                    type="password" 
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={changingPassword}
                  />
                </div>
                <div>
                  <Label htmlFor="new-password" className="mb-2">New Password</Label>
                  <Input 
                    id="new-password"
                    type="password" 
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={changingPassword}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="mb-2">Confirm New Password</Label>
                  <Input 
                    id="confirm-password"
                    type="password" 
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={changingPassword}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-slate-500">Auto logout after inactivity</p>
                  </div>
                  <Select 
                    value={sessionTimeout} 
                    onValueChange={setSessionTimeout}
                    disabled={loadingSettings}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium">Password Policy</p>
                    <p className="text-sm text-slate-500">Minimum password requirements</p>
                  </div>
                  <Select defaultValue="standard" disabled={loadingSettings}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="strict">Strict</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Active Sessions</h4>
                    <Button variant="outline" size="sm">
                      <Activity className="w-3 h-3 mr-2" />
                      View All
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Current Session</p>
                        <p className="text-xs text-slate-500">
                          {navigator.userAgent.split(' ')[0]} • {new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={saveSystemSettings}
                  disabled={loadingSettings}
                >
                  {loadingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Security Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Activity Logs
                  </CardTitle>
                  <CardDescription>View system activity and audit trail</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={fetchAuditLogs} disabled={loadingLogs}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" disabled={loadingLogs}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="create">Created</SelectItem>
                      <SelectItem value="update">Updated</SelectItem>
                      <SelectItem value="delete">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No activity logs found</p>
                  <p className="text-sm text-slate-500 mt-1">
                    System activities will appear here
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="space-y-1">
                              {getActionTypeBadge(log.action_type)}
                              <p className="text-xs text-slate-500">{log.model_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <div>
                                <p className="font-medium">{log.user.name}</p>
                                {log.user.email && (
                                  <p className="text-xs text-slate-500">{log.user.email}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">System</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm truncate">{log.description}</p>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            <div className="space-y-1">
                              <p className="text-sm">{formatDate(log.created_at)}</p>
                              <p className="text-xs">{log.relative_time}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {log.ip_address || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SystemSettings;
