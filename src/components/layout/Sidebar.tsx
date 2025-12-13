import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Home,
  Users,
  BookOpen,
  DollarSign,
  BarChart,
  Calendar,
  Mail,
  Settings,
  LogOut,
  GraduationCap,
  ChevronDown,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const [educationOpen, setEducationOpen] = useState(false);

  const navItems = [
    { title: 'Dashboard', icon: Home, path: '/' },
    { title: 'Beneficiaries', icon: Users, path: '/beneficiaries' },
    { 
      title: 'Education Levels', 
      icon: BookOpen, 
      path: '/education',
      submenu: [
        { title: 'Pre-School', path: '/education/pre-school' },
        { title: 'Primary', path: '/education/primary' },
        { title: 'Secondary', path: '/education/secondary' },
        { title: 'University/College', path: '/education/university' },
        { title: 'Vocational', path: '/education/vocational' },
      ]
    },
    { title: 'Financial Aid', icon: DollarSign, path: '/financial-aid' },
    { title: 'Receipts', icon: DollarSign, path: '/admin/receipts' },
    { title: 'Fee Statements', icon: DollarSign, path: '/admin/statements' },
    { title: 'Performance Analytics', icon: BarChart, path: '/performance' },
    { title: 'Academic Calendar', icon: Calendar, path: '/calendar' },
    { title: 'Communication', icon: Mail, path: '/communication' },
    { title: 'System Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-40",
      collapsed ? 'w-20' : 'w-72'
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center p-6 border-b border-slate-700">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>
        {!collapsed && (
          <h2 className="text-xl font-bold whitespace-nowrap">Kids League Kenya</h2>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-200px)]">
        {navItems.map((item) => (
          <div key={item.title}>
            {item.submenu ? (
              <>
                <button
                  onClick={() => setEducationOpen(!educationOpen)}
                  className={cn(
                    "w-full flex items-center p-3 rounded-lg transition-colors",
                    isActive(item.path) ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        educationOpen && "rotate-180"
                      )} />
                    </>
                  )}
                </button>
                {!collapsed && educationOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className={cn(
                          "block p-2 rounded-lg text-sm transition-colors",
                          location.pathname === sub.path 
                            ? 'bg-blue-500/20 text-blue-300' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        )}
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                to={item.path}
                className={cn(
                  "flex items-center p-3 rounded-lg transition-colors",
                  isActive(item.path) ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'
                )}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="flex items-center mb-4">
          <Avatar className="w-10 h-10 mr-3 flex-shrink-0">
            <AvatarImage src="/api/placeholder/40/40" />
            <AvatarFallback>AU</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div>
              <h4 className="font-semibold text-sm">Admin User</h4>
              <p className="text-xs text-slate-400">admin@klk.org</p>
            </div>
          )}
        </div>
        <button className="flex items-center text-slate-300 hover:text-white transition-colors w-full">
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
