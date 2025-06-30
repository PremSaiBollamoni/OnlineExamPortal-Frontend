import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Award, AlertCircle, BarChart3, Book, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getExamPapers, getSubmissions } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/lib/auth-context';

interface ExamPaper {
  _id: string;
  title: string;
  subject: {
    _id: string;
    name: string;
  };
  duration: number;
  startTime: string;
  endTime: string;
  questions: any[];
  totalMarks: number;
  status: string;
  isActive: boolean;
}

interface Submission {
  _id: string;
  examPaper: ExamPaper;
  score: number;
  status: string;
  student: {
    _id: string;
  };
}

interface ExamDisplay {
  id: string;
  title: string;
  subject: {
    _id: string;
    name: string;
  };
  duration: number;
  status: string;
  questions: number;
  isSubmitted: boolean;
  score?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const { data: examPapers = [], isLoading: isLoadingExams } = useQuery<ExamPaper[]>({
    queryKey: ['examPapers'],
    queryFn: getExamPapers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: getSubmissions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter submissions for current student
  const studentSubmissions = submissions.filter(sub => 
    sub?.student?._id === user?._id && 
    sub?.examPaper && 
    sub?.status
  );
  
  // Get active exams that student hasn't submitted yet
  const activeExams = examPapers.filter(exam => {
    if (!exam?._id || !exam?.questions || !exam?.isActive) return false;
    const hasSubmitted = studentSubmissions.some(sub => sub?.examPaper?._id === exam._id);
    return exam.isActive && !hasSubmitted;
  });

  // Calculate stats
  const stats = {
    totalExams: studentSubmissions.length + activeExams.length,
    completedExams: studentSubmissions.filter(sub => sub?.status === 'published').length,
    averageScore: (() => {
      const publishedSubmissions = studentSubmissions.filter(sub => 
        sub?.status === 'published' && 
        typeof sub?.score === 'number' && 
        typeof sub?.examPaper?.totalMarks === 'number'
      );
      if (publishedSubmissions.length === 0) return 0;
      return Math.round(
        publishedSubmissions.reduce((acc, sub) => 
          acc + (sub.score / sub.examPaper.totalMarks * 100), 0
        ) / publishedSubmissions.length
      );
    })(),
    pendingExams: activeExams.length
  };

  // Get available exams
  const availableExams: ExamDisplay[] = [
    ...activeExams.map(exam => ({
      id: exam._id,
      title: exam.title || 'Untitled Exam',
      subject: exam.subject || { _id: '', name: 'Unknown Subject' },
      duration: exam.duration || 0,
      status: 'live',
      questions: exam.questions?.length || 0,
      isSubmitted: false
    })),
    ...studentSubmissions.map(sub => ({
      id: sub._id,
      title: sub.examPaper?.title || 'Untitled Exam',
      subject: sub.examPaper?.subject || { _id: '', name: 'Unknown Subject' },
      duration: sub.examPaper?.duration || 0,
      status: sub.status || 'pending',
      questions: sub.examPaper?.questions?.length || 0,
      score: sub.status === 'published' && typeof sub.score === 'number' && typeof sub.examPaper?.totalMarks === 'number' ? 
        `${sub.score}/${sub.examPaper.totalMarks} (${Math.round(sub.score / sub.examPaper.totalMarks * 100)}%)` : 
        undefined,
      isSubmitted: true
    }))
  ].sort((a, b) => a.isSubmitted === b.isSubmitted ? 0 : a.isSubmitted ? 1 : -1);

  if (isLoadingExams || isLoadingSubmissions) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-purple-100 mt-2">Welcome back, {user?.name}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.totalExams}</div>
            <p className="text-xs text-blue-600">This semester</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Completed</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.completedExams}</div>
            <p className="text-xs text-green-600">
              {stats.totalExams > 0 ? Math.round((stats.completedExams / stats.totalExams) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats.averageScore}%</div>
            <p className="text-xs text-purple-600">Across all exams</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Pending</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.pendingExams}</div>
            <p className="text-xs text-red-600">Due this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Exams */}
      <Card className="bg-white shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-xl text-gray-800">Available Exams</CardTitle>
          <CardDescription className="text-gray-600">
            Your scheduled examinations and their current status
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {availableExams.map((exam) => (
              <div
                key={exam.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-lg border bg-white hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                    <Badge variant="outline" className={
                      exam.status === 'published' ? 'bg-green-100 text-green-800 border-green-200' :
                      exam.status === 'live' ? 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse' :
                      'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }>
                      {exam.status === 'published' ? 'Completed' :
                       exam.status === 'live' ? 'Live' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Book className="h-4 w-4" />
                      {exam.subject.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {exam.duration} minutes
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {exam.questions} questions
                    </span>
                  </div>
                  {exam.score && (
                    <div className="text-sm font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full inline-block">
                      Score: {exam.score}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {exam.status === 'live' && !exam.isSubmitted && (
                    <Button 
                      onClick={() => navigate(`/exam-panel/${exam.id}`)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Start Exam
                    </Button>
                  )}
                  {exam.status !== 'live' && !exam.isSubmitted && (
                    <Button
                      variant="outline"
                      disabled
                      className="text-gray-400 border-gray-200"
                    >
                      Not Started
                    </Button>
                  )}
                  {exam.isSubmitted && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/submissions/${exam.id}`)}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-300"
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
