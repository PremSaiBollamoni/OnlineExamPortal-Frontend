import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthContext } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefetchDashboardData, queryClient } from '@/lib/api';

const DashboardLayout = () => {
  const { user } = useAuthContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      // Clear any stale data when user changes
      queryClient.clear();
      // Prefetch fresh data
      prefetchDashboardData();
    }
  }, [user]);

  if (!user) {
    return null; // Don't render anything if user is not authenticated
  }

  return (
    <div className="flex h-screen relative">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu />
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 transform md:relative md:translate-x-0 transition duration-200 ease-in-out z-40",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar userType={user.role} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
        <div className="md:hidden h-12" /> {/* Spacer for mobile menu button */}
        <Outlet />
      </main>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
