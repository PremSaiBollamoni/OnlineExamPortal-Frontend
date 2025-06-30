import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  LogOut,
  X,
  BookOpen,
  PenTool,
  History,
  BarChart
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userType: "student" | "faculty" | "admin";
  onClose?: () => void;
}

const Sidebar = ({ userType, onClose }: SidebarProps) => {
  const { logout, user } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavItems = () => {
    switch (userType) {
      case "admin":
        return [
          { label: "Dashboard", icon: <LayoutDashboard />, href: "/admin" },
          { label: "Users", icon: <Users />, href: "/admin/users" },
          { label: "Subjects", icon: <BookOpen />, href: "/admin/subjects" },
          { label: "Papers", icon: <FileText />, href: "/admin/papers" },
          { label: "Results", icon: <ClipboardList />, href: "/admin/results" },
          { label: "Analytics", icon: <BarChart />, href: "/admin/analytics" },
        ];
      case "faculty":
        return [
          { label: "Dashboard", icon: <LayoutDashboard />, href: "/faculty" },
          { label: "Papers", icon: <FileText />, href: "/faculty/papers" },
          { label: "Submissions", icon: <ClipboardList />, href: "/faculty/submissions" },
          { label: "Submit to Admin", icon: <FileText />, href: "/faculty/evaluated" },
        ];
      case "student":
        return [
          { label: "Dashboard", icon: <LayoutDashboard />, href: "/dashboard" },
          { label: "Available Exams", icon: <PenTool />, href: "/exams" },
          { label: "Results", icon: <ClipboardList />, href: "/results" },
          { label: "Exam History", icon: <History />, href: "/exam-history" },
        ];
      default:
        return [];
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (onClose) {
      onClose();
    }
    navigate(href);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  if (!user || !userType) {
    return null;
  }

  return (
    <div className="w-64 bg-white border-r h-full flex flex-col relative">
      {onClose && (
        <Button
          variant="ghost"
          className="absolute right-4 top-4 md:hidden"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="p-6">
        <div className="flex flex-col items-center mb-4">
          <img 
            src="/sidebar.png" 
            alt="Centurion University Logo" 
            className="h-32 w-auto mb-2"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">CUTM Portal</h2>
        <p className="text-sm text-gray-600 mt-1">{user?.name}</p>
        <p className="text-xs text-gray-500 mt-1 capitalize">{userType} Account</p>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {getNavItems().map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-800",
                  location.pathname === item.href && "bg-red-50 text-red-800"
                )}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.icon}
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full flex items-center gap-2 text-gray-700 hover:bg-red-50 hover:text-red-800"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
