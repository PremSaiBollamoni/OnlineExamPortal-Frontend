import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getExamPapers, getSubmissions } from '@/lib/api';
import { useAuthContext } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const Exams = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  // Fetch both exam papers and submissions
  const { data: examPapers, isLoading: isLoadingExams } = useQuery({
    queryKey: ['examPapers'],
    queryFn: getExamPapers,
  });

  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: getSubmissions,
  });

  const isLoading = isLoadingExams || isLoadingSubmissions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Filter active exams and check if they're already completed by the student
  const availableExams = examPapers?.filter((exam: any) => {
    // Check if student has already submitted this exam
    const hasSubmitted = submissions?.some((sub: any) => 
      sub.examPaper._id === exam._id && 
      sub.student._id === user?._id &&
      sub.isSubmitted
    );

    // Show exam if it's approved and not submitted
    return exam.status === 'approved' && !hasSubmitted;
  }) || [];

  const handleStartExam = (examId: string) => {
    // Double check if exam is already submitted
    const hasSubmitted = submissions?.some((sub: any) => 
      sub.examPaper._id === examId && 
      sub.student._id === user?._id &&
      sub.isSubmitted
    );

    if (hasSubmitted) {
      toast({
        title: "Cannot Start Exam",
        description: "You have already submitted this exam.",
        variant: "destructive",
      });
      return;
    }

    navigate(`/exam-panel/${examId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Available Exams</h1>
        <p className="text-gray-600 mt-2">View and take your scheduled examinations</p>
      </div>

      {availableExams.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">No exams are currently available.</p>
            <p className="text-gray-500 text-sm text-center mt-2">
              Check back later for upcoming examinations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableExams.map((exam: any) => (
            <Card key={exam._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2">
                    {exam.subject.name}
                  </Badge>
                  <Badge variant="secondary">
                    {exam.totalMarks} Marks
                  </Badge>
                </div>
                <CardTitle className="text-xl">{exam.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {exam.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      Duration: {exam.duration} mins
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FileText className="h-4 w-4 mr-2" />
                      Questions: {exam.questions?.length || 0}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    onClick={() => handleStartExam(exam._id)}
                  >
                    Start Exam
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Exams;
