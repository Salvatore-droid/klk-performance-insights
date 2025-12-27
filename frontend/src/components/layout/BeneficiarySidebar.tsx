import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Home,
  FileText,
  Upload,
  MessageSquare,
  User,
  DollarSign,
  LogOut,
  GraduationCap,
  Receipt,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BeneficiarySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const BeneficiarySidebar = ({ collapsed, onToggle }: BeneficiarySidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, logout } = useAuth(); // Now both signOut and logout are available
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('kids_league_token');
      
      if (!token) {
        setUserProfile(user); // Use user from auth context
        return;
      }

      // Try to get profile from auth/validate endpoint
      try {
        const response = await fetch('http://localhost:8000/api/auth/validate/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data?.success && data.user) {
            setUserProfile(data.user);
            return;
          }
        }
      } catch (error) {
        console.log('auth/validate endpoint failed');
      }

      // If auth/validate fails, use the user from context
      setUserProfile(user);
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to user from context
      setUserProfile(user);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { title: 'My Dashboard', icon: Home, path: '/portal' },
    { title: 'My Documents', icon: FileText, path: '/portal/documents' },
    { title: 'Upload Documents', icon: Upload, path: '/portal/upload' },
    { title: 'Fee Statements', icon: Receipt, path: '/portal/statements' },
    { title: 'My Receipts', icon: DollarSign, path: '/portal/receipts' },
    { title: 'Academic Records', icon: BookOpen, path: '/portal/academics' },
    { title: 'Messages', icon: MessageSquare, path: '/portal/messages' },
    { title: 'My Profile', icon: User, path: '/portal/profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/portal') return location.pathname === '/portal';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      // Use signOut (which is the actual function)
      if (signOut && typeof signOut === 'function') {
        await signOut();
      } 
      // Or use logout alias if you prefer
      else if (logout && typeof logout === 'function') {
        await logout();
      }
      // Fallback manual logout
      else {
        localStorage.removeItem('kids_league_token');
        toast({
          title: 'Logged out',
          description: 'You have been logged out.',
        });
        navigate('/auth');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local storage
      localStorage.removeItem('kids_league_token');
      toast({
        title: 'Logged out',
        description: 'You have been logged out.',
      });
      navigate('/auth');
    }
  };

  const getDisplayName = () => {
    if (userProfile?.full_name) return userProfile.full_name;
    if (user?.full_name) return user.full_name;
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    if (user?.username) return user.username;
    return 'Beneficiary';
  };

  const getRole = () => {
    if (userProfile?.role) return userProfile.role;
    if (user?.role) return user.role;
    return 'Beneficiary';
  };

  const getAvatarInitials = () => {
    const name = getDisplayName();
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-gradient-to-b from-emerald-900 to-emerald-800 text-white transition-all duration-300 z-40",
      collapsed ? 'w-20' : 'w-72'
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center p-6 border-b border-emerald-700">
        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold whitespace-nowrap">Student Portal</h2>
            <p className="text-xs text-emerald-300">Kids League Kenya</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-200px)]">
        {navItems.map((item) => (
          <Link
            key={item.title}
            to={item.path}
            className={cn(
              "flex items-center p-3 rounded-lg transition-colors",
              isActive(item.path) ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-700'
            )}
          >
            <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-emerald-700 bg-emerald-900/50">
        {loading ? (
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-emerald-700 rounded-full animate-pulse mr-3 flex-shrink-0"></div>
            {!collapsed && (
              <div className="flex-1">
                <div className="h-4 bg-emerald-700 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-emerald-700 rounded animate-pulse w-3/4"></div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center mb-4">
              <Avatar className="w-10 h-10 mr-3 flex-shrink-0">
                <AvatarFallback className="bg-emerald-600 text-white">
                  {getAvatarInitials()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div>
                  <h4 className="font-semibold text-sm truncate">{getDisplayName()}</h4>
                  <p className="text-xs text-emerald-300 truncate">{getRole()}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-emerald-200 hover:text-white transition-colors w-full"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

export default BeneficiarySidebar;