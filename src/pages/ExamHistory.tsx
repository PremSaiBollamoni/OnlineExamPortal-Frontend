import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSubmissions } from '@/lib/api';
import { useAuthContext } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, FileText, CheckCircle, XCircle, Calendar, Timer, Book } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';

// Helper functions
const calculateTimeTaken = (startTime: string, endTime: string, duration: number) => {
  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    // Handle invalid dates
    if (isNaN(start) || isNaN(end)) {
      return { timeTaken: 1, percentage: 1 };
    }
    
    // Calculate actual time taken in minutes
    const timeTaken = Math.max(Math.round((end - start) / (1000 * 60)), 1);
    
    // Calculate percentage, ensuring at least 1%
    const percentage = Math.max(
      Math.min(Math.round((timeTaken / (duration || 60)) * 100), 100),
      1
    );
    
    return { timeTaken, percentage };
  } catch (error) {
    console.error('Error calculating time:', error);
    return { timeTaken: 1, percentage: 1 };
  }
};

const formatDate = (date: string) => {
  return format(new Date(date), 'PPpp');
};

const getTimeStatus = (percentage: number) => {
  if (percentage <= 50) return { color: 'text-green-600', text: 'Excellent time management' };
  if (percentage <= 75) return { color: 'text-blue-600', text: 'Good pace' };
  if (percentage <= 90) return { color: 'text-yellow-600', text: 'Cut it close' };
  return { color: 'text-red-600', text: 'Time pressure' };
};

const getCompletionStatus = (answered: number, total: number, status: string) => {
  // Get actual question count from exam paper
  if (!total || total === 0) {
    return { color: 'text-gray-600', text: 'Loading questions...' };
  }

  // If the submission is evaluated or published, show actual question count
  if (status === 'evaluated' || status === 'published' || status === 'submitted_to_admin') {
    return { 
      color: 'text-green-600', 
      text: `Complete (${total}/${total} questions)` 
    };
  }
  
  const percentage = (answered / total) * 100;
  if (percentage === 100) return { color: 'text-green-600', text: `Complete (${total}/${total} questions)` };
  if (percentage >= 75) return { color: 'text-yellow-600', text: `Mostly Complete (${answered}/${total} questions)` };
  return { color: 'text-red-600', text: `Incomplete (${answered}/${total} questions)` };
};

const getScoreStatus = (score: number, totalMarks: number) => {
  const percentage = Math.round((score / totalMarks) * 100);
  return {
    color: percentage >= 40 ? 'text-green-600' : 'text-red-600',
    text: `Score: ${score}/${totalMarks} (${percentage}%) ${percentage >= 40 ? 'Passed' : 'Failed'}`
  };
};

const ExamHistory = () => {
  const { user } = useAuthContext();
  
  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ['submissions', user?._id],
    queryFn: getSubmissions,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load exam history. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filter submissions for the current user and sort by date
  const userSubmissions = submissions && user?._id
    ? submissions
        .filter((sub: any) => {
          // Make sure we have all required fields
          const isValid = 
            sub.student?._id === user._id &&
            sub.examPaper &&
            sub.startTime &&
            sub.endTime &&
            Array.isArray(sub.answers);
          
          return isValid;
        })
        .sort((a: any, b: any) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
    : [];

  // Calculate statistics only if we have submissions
  const completedExams = userSubmissions.filter((sub: any) => 
    sub.status === 'published' || sub.status === 'evaluated' || sub.status === 'submitted_to_admin'
  ).length;

  const completionRate = userSubmissions.length > 0
    ? Math.round((completedExams / userSubmissions.length) * 100)
    : 0;

  // Fixed time calculation
  const averageTimePercentage = userSubmissions.length > 0
    ? Math.round(
        userSubmissions.reduce((acc: number, sub: any) => {
          const { percentage } = calculateTimeTaken(
            sub.startTime,
            sub.endTime,
            sub.examPaper?.duration || 60
          );
          if (sub.status === 'published' || sub.status === 'evaluated' || sub.status === 'submitted_to_admin') {
            return acc + percentage;
          }
          return acc;
        }, 0) / Math.max(completedExams, 1)
      )
    : 0;

  console.log('Final Stats:', {
    totalSubmissions: userSubmissions.length,
    completedExams,
    completionRate,
    averageTimePercentage
  });

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold">Exam Attempts</h1>
        <p className="text-indigo-100 mt-2">Track your exam participation and time management</p>
      </div>

      {/* Activity Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-blue-800">Total Attempts</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{userSubmissions.length}</div>
            <p className="text-sm text-blue-600 mt-1">All exam sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-green-800">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {completionRate}%
            </div>
            <div className="mt-2">
              <Progress value={completionRate} className="h-2 [&>div]:bg-green-500" />
              <p className="text-sm text-green-600 mt-2">
                {completedExams} of {userSubmissions.length} exams completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-yellow-800">Avg. Time Used</CardTitle>
              <Timer className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {averageTimePercentage}%
            </div>
            <div className="mt-2">
              <Progress value={averageTimePercentage} className="h-2 [&>div]:bg-yellow-500" />
              <p className="text-sm text-yellow-600 mt-2">Of allocated time</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-purple-800">Latest Attempt</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {userSubmissions.length > 0
                ? formatDistanceToNow(new Date(userSubmissions[0].endTime), { addSuffix: true })
                : 'N/A'}
            </div>
            <p className="text-sm text-purple-600 mt-1">Most recent exam</p>
          </CardContent>
        </Card>
      </div>

      {userSubmissions.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4 animate-pulse" />
            <p className="text-gray-600 text-center font-medium">No exam attempts yet.</p>
            <p className="text-gray-500 text-sm text-center mt-2">
              Your exam attempts will be recorded here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="text-xl text-gray-800">Attempt History</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <div className="space-y-6">
              {userSubmissions.map((submission: any) => {
                // Get actual question count from exam paper
                const totalQuestions = submission.examPaper?.questions?.length || 0;
                const answeredQuestions = submission.answers?.filter((answer: any) => answer && answer.answer && answer.answer.trim() !== '').length || 0;
                
                // Calculate time taken properly
                const { timeTaken, percentage } = calculateTimeTaken(
                  submission.startTime,
                  submission.endTime,
                  submission.examPaper?.duration || 60 // Default to 60 minutes if duration is missing
                );

                const timeStatus = getTimeStatus(percentage);
                const completionStatus = getCompletionStatus(
                  answeredQuestions,
                  totalQuestions,
                  submission.status
                );
                const scoreStatus = submission.score !== null ? getScoreStatus(
                  submission.score,
                  submission.examPaper?.totalMarks || 0
                ) : null;

                return (
                  <div key={submission._id} className="border rounded-lg p-6 space-y-4 bg-white hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {submission.examPaper?.title || 'Untitled Exam'}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {submission.examPaper?.subject?.name || 'Unknown Subject'}
                          </Badge>
                          {scoreStatus && (
                            <Badge className={`${
                              scoreStatus.text.includes('Passed') ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              {scoreStatus.text}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {/* Time Taken */}
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Time Management</div>
                        <Progress value={percentage} className="h-2" />
                        <div className={`text-sm font-medium ${timeStatus.color}`}>
                          {timeTaken} minutes ({percentage}% of allocated time)
                        </div>
                        <div className="text-xs text-gray-500">{timeStatus.text}</div>
                      </div>

                      {/* Completion Status */}
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Completion Status</div>
                        <Progress 
                          value={
                            submission.status === 'evaluated' || submission.status === 'published' || submission.status === 'submitted_to_admin'
                              ? 100
                              : (answeredQuestions / totalQuestions) * 100 || 0
                          } 
                          className="h-2" 
                        />
                        <div className={`text-sm font-medium ${completionStatus.color}`}>
                          {completionStatus.text}
                        </div>
                      </div>

                      {/* Score */}
                      {scoreStatus && (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500">Final Score</div>
                          <Progress 
                            value={(submission.score / submission.examPaper?.totalMarks) * 100} 
                            className="h-2" 
                          />
                          <div className={`text-sm font-medium ${scoreStatus.color}`}>
                            {scoreStatus.text}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submission Time */}
                    <div className="text-sm text-gray-500 mt-4">
                      Submitted {formatDistanceToNow(new Date(submission.endTime), { addSuffix: true })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExamHistory; 