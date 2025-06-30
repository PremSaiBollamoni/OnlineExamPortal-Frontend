import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getUsers, getExamPapers, getSubmissions } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { BarChart2, Users, School, BookOpen, GraduationCap, FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

const Analytics = () => {
  const [showAllGraphs, setShowAllGraphs] = React.useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: getSubmissions
  });

  const { data: examPapers = [] } = useQuery({
    queryKey: ['examPapers'],
    queryFn: getExamPapers
  });

  // Process data for graphs
  const roleData = useMemo(() => {
    const roleCounts = users.reduce((acc: { [key: string]: number }, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(roleCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [users]);

  const departmentData = useMemo(() => {
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

  const semesterData = useMemo(() => {
    const semCounts = users
      .filter((user: any) => user.role === 'student' && user.semester)
      .reduce((acc: { [key: string]: number }, user: any) => {
        acc[`Semester ${user.semester}`] = (acc[`Semester ${user.semester}`] || 0) + 1;
        return acc;
      }, {});
    return Object.entries(semCounts)
      .sort((a, b) => parseInt(a[0].split(' ')[1]) - parseInt(b[0].split(' ')[1]))
      .map(([name, students]) => ({ name, students }));
  }, [users]);

  const specializationData = useMemo(() => {
    const specCounts = users
      .filter((user: any) => user.role === 'student' && user.specialization)
      .reduce((acc: { [key: string]: number }, user: any) => {
        if (user.specialization) {
          acc[user.specialization] = (acc[user.specialization] || 0) + 1;
        }
        return acc;
      }, {});
    return Object.entries(specCounts).map(([name, value]) => ({ name, value }));
  }, [users]);

  // Calculate exam statistics
  const examStatusData = useMemo(() => {
    const statusCounts = examPapers.reduce((acc: { [key: string]: number }, paper: any) => {
      const status = paper.status || 'Pending';
      acc[status.charAt(0).toUpperCase() + status.slice(1)] = (acc[status.charAt(0).toUpperCase() + status.slice(1)] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [examPapers]);

  // Calculate submission statistics by month
  const submissionTimeData = useMemo(() => {
    const hourCounts: { [key: number]: number } = {};
    
    submissions.forEach((submission: any) => {
      if (submission.submittedAt) {
        const hour = new Date(submission.submittedAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      submissions: hourCounts[hour] || 0
    }));
  }, [submissions]);

  // Calculate average scores by department
  const avgScoresByDept = useMemo(() => {
    const deptScores: { [key: string]: { total: number; count: number } } = {};
    
    submissions.forEach((submission: any) => {
      const student = users.find((u: any) => u._id === submission.studentId);
      if (student?.department && submission.score !== undefined) {
        if (!deptScores[student.department]) {
          deptScores[student.department] = { total: 0, count: 0 };
        }
        deptScores[student.department].total += submission.score;
        deptScores[student.department].count += 1;
      }
    });

    return Object.entries(deptScores)
      .map(([dept, scores]) => ({
        name: dept,
        avgScore: Math.round((scores.total / scores.count) * 100) / 100
      }))
      .sort((a, b) => b.avgScore - a.avgScore); // Sort by average score descending
  }, [submissions, users]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive statistics and insights</p>
        </div>
        <Button
          onClick={() => setShowAllGraphs(!showAllGraphs)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          <BarChart2 className="h-4 w-4 mr-2" />
          {showAllGraphs ? 'Show Less' : 'View All Analytics'}
        </Button>
      </div>

      {/* Main Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Bar dataKey="students" fill="#3B82F6" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Semester Distribution */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Semester-wise Distribution
            </CardTitle>
            <CardDescription>Student count by semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={semesterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#6366F1" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Specialization Distribution */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Specialization Distribution
            </CardTitle>
            <CardDescription>Students by specialization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specializationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {specializationData.map((entry, index) => (
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

        {/* Exam Paper Status */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exam Paper Status
            </CardTitle>
            <CardDescription>Distribution of exam paper statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={examStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {examStatusData.map((entry, index) => (
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

        {/* Average Scores by Department */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Average Scores by Department
            </CardTitle>
            <CardDescription>Department-wise performance analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgScoresByDept}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#10B981" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Submission Time Analysis */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Submission Time Analysis
            </CardTitle>
            <CardDescription>When students typically submit their exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={submissionTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="submissions" stroke="#8B5CF6" name="Submissions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics; 