import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

interface BeneficiarySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const BeneficiarySidebar = ({ collapsed, onToggle }: BeneficiarySidebarProps) => {
  const location = useLocation();

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
        <div className="flex items-center mb-4">
          <Avatar className="w-10 h-10 mr-3 flex-shrink-0">
            <AvatarImage src="/api/placeholder/40/40" />
            <AvatarFallback>JM</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div>
              <h4 className="font-semibold text-sm">Jane Muthoni</h4>
              <p className="text-xs text-emerald-300">Beneficiary</p>
            </div>
          )}
        </div>
        <Link to="/" className="flex items-center text-emerald-200 hover:text-white transition-colors w-full">
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Link>
      </div>
    </aside>
  );
};

export default BeneficiarySidebar;
