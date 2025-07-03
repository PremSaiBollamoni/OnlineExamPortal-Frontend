import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, CheckCircle, Clock, TrendingUp, User, Calendar, Activity as ActivityIcon, School, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getExamPapers, getResultStats, getUsers, getActivities, getSubmissions } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '@/lib/socket-context';
import { formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444'];

interface DashboardStats {
  totalUsers: number;
  activeExams: number;
  completedToday: number;
  pendingReviews: number;
}

interface Activity {
  action: string;
  user: string;
  time: string;
  type: 'user' | 'paper' | 'result';
}

interface PendingPaper {
  _id: string;
  title: string;
  facultyId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  questions: any[];
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [showAllActivities, setShowAllActivities] = useState(false);

  const { data: examPapers = [], isLoading: isLoadingPapers } = useQuery({
    queryKey: ['examPapers'],
    queryFn: getExamPapers
  });

  const { data: resultStats = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ['resultStats'],
    queryFn: getResultStats
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: getActivities
  });

  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: getSubmissions
  });

  // Calculate stats directly from the data
  const stats: DashboardStats = {
    totalUsers: users?.length || 0,
    activeExams: examPapers?.filter((paper: any) => paper.status === 'approved')?.length || 0,
    completedToday: examPapers?.filter((paper: any) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const updatedDate = new Date(paper.updatedAt);
      return paper.status === 'completed' && updatedDate >= today;
    })?.length || 0,
    pendingReviews: submissions?.filter((submission: any) => submission.status === 'submitted_to_admin')?.length || 0
  };

  // Get pending approvals for display
  const pendingApprovalsList = useMemo(() => {
    return examPapers
      ?.filter((paper: any) => paper.status === 'pending')
      ?.map((paper: any) => ({
        _id: paper._id,
        title: paper.title,
        facultyId: paper.facultyId,
        createdAt: new Date(paper.createdAt).toLocaleDateString(),
        questions: paper.questions
      })) || [];
  }, [examPapers]);

  // Get limited activities for dashboard
  const displayedActivities = showAllActivities ? activities : activities.slice(0, 3);

  // Calculate role distribution
  const roleData = useMemo(() => {
    if (!users?.length) return [];
    const roleCounts = users.reduce((acc: { [key: string]: number }, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
  }, [users]);

  // Calculate department distribution
  const departmentData = useMemo(() => {
    if (!users?.length) return [];
    const deptCounts = users
      .filter((user: any) => user.role === 'student')
      .reduce((acc: { [key: string]: number }, user: any) => {
        if (user.department) {
          acc[user.department] = (acc[user.department] || 0) + 1;
        }
        return acc;
      }, {});
    return Object.entries(deptCounts).map(([name, students]) => ({ name, students }));
  }, [users]);

  const handleApprove = async (paperId: string) => {
    try {
      // TODO: Implement approve functionality
      console.log('Approving paper:', paperId);
    } catch (error) {
      console.error('Error approving paper:', error);
    }
  };

  const handleReject = async (paperId: string) => {
    try {
      // TODO: Implement reject functionality
      console.log('Rejecting paper:', paperId);
    } catch (error) {
      console.error('Error rejecting paper:', error);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'users':
        navigate('/admin/users');
        break;
      case 'papers':
        navigate('/admin/papers');
        break;
      case 'results':
        navigate('/admin/results');
        break;
    }
  };

  if (isLoadingPapers || isLoadingStats || isLoadingUsers || isLoadingActivities || isLoadingSubmissions) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { title: 'Total Users', icon: Users },
            { title: 'Active Exams', icon: FileText },
            { title: 'Completed Today', icon: CheckCircle },
            { title: 'Pending Reviews', icon: Clock }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="overflow-hidden transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Loading state for other sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-100 animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-50 rounded animate-pulse"></div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-100 animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-50 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { 
            title: 'Total Users', 
            value: stats.totalUsers, 
            icon: Users,
            color: 'bg-blue-50 text-blue-700',
            valueColor: 'text-blue-700'
          },
          { 
            title: 'Active Exams', 
            value: stats.activeExams, 
            icon: FileText,
            color: 'bg-green-50 text-green-700',
            valueColor: 'text-green-700'
          },
          { 
            title: 'Completed Today', 
            value: stats.completedToday, 
            icon: CheckCircle,
            color: 'bg-purple-50 text-purple-700',
            valueColor: 'text-purple-700'
          },
          { 
            title: 'Pending Reviews', 
            value: stats.pendingReviews, 
            icon: Clock,
            color: 'bg-red-50 text-red-700',
            valueColor: 'text-red-700'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="overflow-hidden transition-all duration-200 hover:shadow-lg">
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${stat.color}`}>
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Preview */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Analytics Overview</h2>
        <Button
          onClick={() => navigate('/admin/analytics')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          <BarChart2 className="h-4 w-4 mr-2" />
          View All Analytics
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Role Distribution
            </CardTitle>
            <CardDescription>Distribution of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Department-wise Distribution
            </CardTitle>
            <CardDescription>Number of students per department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
            <CardTitle className="text-base md:text-lg">Pending Approvals</CardTitle>
            <CardDescription className="text-gray-200">
              Exam papers waiting for approval
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {pendingApprovalsList.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No pending approvals</div>
            ) : (
              <div className="space-y-4">
                {pendingApprovalsList.map((paper: PendingPaper) => (
                  <div key={paper._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <h3 className="font-medium truncate">{paper.title}</h3>
                      <p className="text-sm text-gray-500">
                        By {paper.facultyId?.name} • {paper.createdAt}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{paper.questions?.length || 0} Questions</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => handleReject(paper._id)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => handleApprove(paper._id)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <ActivityIcon className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <CardDescription className="text-gray-200">
                  Latest system activities and user actions
                </CardDescription>
              </div>
              {activities.length > 3 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-blue-900 hover:bg-blue-50"
                  onClick={() => {
                    if (showAllActivities) {
                      setShowAllActivities(false);
                    } else {
                      navigate('/admin/activities');
                    }
                  }}
                >
                  {showAllActivities ? 'Show Less' : 'View All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-center text-gray-500">No recent activities</div>
              ) : (
                <>
                  {displayedActivities.map((activity: any) => (
                    <div key={activity._id} className="flex items-start gap-3 p-2 border rounded-lg hover:bg-gray-50">
                      <div className="p-2 rounded-full bg-blue-50">
                        {activity.type === 'user' ? (
                          <User className="h-4 w-4 text-blue-600" />
                        ) : activity.type === 'paper' ? (
                          <FileText className="h-4 w-4 text-blue-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{activity.action}</p>
                        <p className="text-xs text-gray-500">
                          {activity.user?.name} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
