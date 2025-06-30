import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Save, ArrowLeft, ArrowRight, CheckCircle, ChevronLeft, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubmission, evaluateSubmission, submitToAdmin } from '@/lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isValid, parseISO, differenceInMinutes } from 'date-fns';

interface Answer {
  questionIndex: number;
  selectedOption: string;
  marks?: number;
  comment?: string;
}

interface ExamPaper {
  title: string;
  questions: {
    type: string;
    question: string;
    options: string[];
    correctAnswer: string;
    marks: number;
  }[];
}

interface Submission {
  _id: string;
  student: {
    name: string;
    studentId: string;
  };
  examPaper: ExamPaper;
  answers: Answer[];
  status: 'pending' | 'evaluated' | 'submitted_to_admin' | 'published';
  startTime: string;
  submittedAt: string;
}

const Evaluate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [marks, setMarks] = useState<{[key: number]: number}>({});
  const [comments, setComments] = useState<{[key: number]: string}>({});

  // Debug log
  console.log('Submission ID:', id);

  const { data: submission, isLoading, error } = useQuery<Submission, Error>({
    queryKey: ['submission', id],
    queryFn: () => getSubmission(id || ''),
    enabled: !!id,
    retry: 1,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      console.log('Submission loaded:', data);
    },
    onError: (error) => {
      console.error('Error fetching submission:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submission",
        variant: "destructive"
      });
      navigate('/faculty/submissions');
    }
  } as any); // Type assertion to avoid TypeScript errors with query options

  // Debug log
  console.log('Submission data:', submission);

  useEffect(() => {
    if (!id) {
      console.log('No submission ID found, redirecting...');
      navigate('/faculty/submissions');
      return;
    }
  }, [id, navigate]);

  // Initialize marks and comments from existing evaluation data
  useEffect(() => {
    if (submission?.answers) {
      const existingMarks: {[key: number]: number} = {};
      const existingComments: {[key: number]: string} = {};
      
      submission.answers.forEach((answer: Answer, index: number) => {
        existingMarks[index + 1] = Number(answer.marks) || 0;
        existingComments[index + 1] = answer.comment || '';
      });
      
      setMarks(existingMarks);
      setComments(existingComments);
    }
  }, [submission]);

  const evaluateMutation = useMutation<any, Error, any>({
    mutationFn: (data: any) => evaluateSubmission(id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast({
        title: "Success",
        description: "Student's exam has been evaluated successfully"
      });
      navigate('/faculty/submissions');
    },
    onError: (error) => {
      console.error('Evaluation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save evaluation",
        variant: "destructive"
      });
    }
  });

  const submitToAdminMutation = useMutation<any, Error, void>({
    mutationFn: () => submitToAdmin(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast({
        title: "Success",
        description: "The evaluation has been submitted to admin for review"
      });
      navigate('/faculty/submissions');
    },
    onError: (error) => {
      console.error('Submit to admin error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit to admin",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <p className="text-red-500">Failed to load submission</p>
          <Button variant="outline" onClick={() => navigate('/faculty/submissions')}>
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  const formatSubmissionDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return 'Invalid date';
      }
      return format(date, 'PPp');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTimeTaken = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 'Not available';
    try {
      const start = parseISO(startTime);
      const end = parseISO(endTime);
      if (!isValid(start) || !isValid(end)) {
        return 'Invalid duration';
      }
      const minutes = differenceInMinutes(end, start);
      if (minutes < 60) {
        return `${minutes} minutes`;
      }
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } catch (error) {
      return 'Invalid duration';
    }
  };

  // Map the submission answers to include question details from exam paper
  const questions = submission.examPaper?.questions?.map((question: any, index: number) => {
    const submittedAnswer = submission.answers?.find(
      (a: any) => a.questionIndex === index
    );
    return {
      id: index + 1,
      type: question.type,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      studentAnswer: submittedAnswer?.selectedOption || '',
      marks: Number(submittedAnswer?.marks || 0),
      maxMarks: Number(question.marks || 0),
      isCorrect: submittedAnswer?.selectedOption === question.correctAnswer
    };
  }) || [];

  const currentQuestion = questions[currentQuestionIndex] || {
    id: 0,
    type: '',
    question: '',
    options: [],
    correctAnswer: '',
    studentAnswer: '',
    marks: 0,
    maxMarks: 0,
    isCorrect: false
  };

  const calculateTotalAwarded = () => {
    const marksFromState = Object.values(marks).reduce((sum, mark) => {
      const numMark = Number(mark) || 0;
      return sum + numMark;
    }, 0);
    
    if (marksFromState > 0) return marksFromState;
    
    return questions.reduce((sum, q) => {
      const questionMark = Number(q.marks) || 0;
      return sum + questionMark;
    }, 0);
  };

  const totalAwarded = calculateTotalAwarded();
  const progress = ((currentQuestionIndex + 1) / Math.max(questions.length, 1)) * 100;

  const handleMarkChange = (questionId: number, newMark: string | number) => {
    const numericMark = Number(newMark) || 0;
    const maxMark = questions[questionId - 1]?.maxMarks || 0;
    const validMark = Math.min(Math.max(0, numericMark), maxMark);
    setMarks(prev => ({ ...prev, [questionId]: validMark }));
  };

  const handleCommentChange = (questionId: number, comment: string) => {
    setComments(prev => ({ ...prev, [questionId]: comment }));
  };

  const saveEvaluation = () => {
    const evaluationData = questions.map((q, index) => ({
      questionIndex: index,
      marks: marks[index + 1] || q.marks,
      comment: comments[index + 1] || ''
    }));

    evaluateMutation.mutate({
      score: evaluationData.reduce((sum, item) => sum + item.marks, 0),
      evaluations: evaluationData
    });
  };

  const handleSubmitToAdmin = () => {
    submitToAdminMutation.mutate();
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Back and Title Section */}
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          className="flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => navigate('/faculty/submissions')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Submissions
        </Button>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Evaluate Submission</h1>
            <p className="text-gray-600 mt-1">Review and grade student answers</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={saveEvaluation} 
              className="bg-red-800 hover:bg-red-900 flex-1 sm:flex-none"
              disabled={evaluateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {evaluateMutation.isPending ? 'Saving...' : 'Save Evaluation'}
            </Button>
            {submission.status === 'evaluated' && (
              <Button
                onClick={handleSubmitToAdmin}
                className="bg-green-700 hover:bg-green-800 flex-1 sm:flex-none"
                disabled={submitToAdminMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitToAdminMutation.isPending ? 'Submitting...' : 'Submit to Admin'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Status:</span>
        <Badge className={
          submission.status === 'published' ? 'bg-green-100 text-green-800' :
          submission.status === 'submitted_to_admin' ? 'bg-yellow-100 text-yellow-800' :
          submission.status === 'evaluated' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }>
          {submission.status === 'published' ? 'Published' :
           submission.status === 'submitted_to_admin' ? 'Pending Admin Review' :
           submission.status === 'evaluated' ? 'Evaluated' :
           'Pending Evaluation'}
        </Badge>
      </div>

      {/* Student Info & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Student:</span>
                <p className="font-semibold break-words">{submission.student?.name || 'Unknown'} ({submission.student?.studentId || 'No ID'})</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Exam:</span>
                <p className="font-semibold break-words">{submission.examPaper?.title || 'Untitled Exam'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Submitted:</span>
                <p>{formatSubmissionDate(submission.submittedAt)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Time Taken:</span>
                <p>{formatTimeTaken(submission.startTime, submission.submittedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="mt-2" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-800">{totalAwarded}</p>
                <p className="text-sm text-gray-600">Total Marks Awarded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Evaluation */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={currentQuestion.type === 'mcq' ? 'default' : 'secondary'}>
                  {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Subjective'}
                </Badge>
                <Badge variant="outline">
                  {currentQuestion.maxMarks} marks
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex-1 sm:flex-none justify-center"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex-1 sm:flex-none justify-center"
              >
                <span className="mr-2 hidden sm:inline">Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div>
            <Label className="text-base font-medium">Question:</Label>
            <p className="mt-2 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">{currentQuestion.question}</p>
          </div>

          {/* MCQ Options (if applicable) */}
          {currentQuestion.type === 'mcq' && currentQuestion.options && (
            <div>
              <Label className="text-base font-medium">Options:</Label>
              <div className="mt-2 space-y-2">
                {currentQuestion.options.map((option: string, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      option === currentQuestion.correctAnswer
                        ? 'bg-green-100 border-green-300'
                        : option === currentQuestion.studentAnswer
                        ? currentQuestion.isCorrect
                          ? 'bg-green-100 border-green-300'
                          : 'bg-red-100 border-red-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                      <span className="flex-1">{option}</span>
                      {option === currentQuestion.correctAnswer && (
                        <span className="text-green-600 font-medium whitespace-nowrap">(Correct)</span>
                      )}
                      {option === currentQuestion.studentAnswer && option !== currentQuestion.correctAnswer && (
                        <span className="text-red-600 font-medium whitespace-nowrap">(Student Answer)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Answer */}
          <div>
            <Label className="text-base font-medium">Student Answer:</Label>
            <div className="mt-2">
              {currentQuestion.type === 'mcq' ? (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                  currentQuestion.isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <CheckCircle className={`h-5 w-5 ${
                    currentQuestion.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span>{currentQuestion.studentAnswer || 'No answer provided'}</span>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {currentQuestion.studentAnswer || 'No answer provided'}
                </div>
              )}
            </div>
          </div>

          {/* Evaluation */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="marks">Marks Awarded</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="marks"
                  type="number"
                  min="0"
                  max={currentQuestion.maxMarks}
                  value={marks[currentQuestion.id] || currentQuestion.marks}
                  onChange={(e) => handleMarkChange(currentQuestion.id, e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">
                  out of {currentQuestion.maxMarks}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                value={comments[currentQuestion.id] || ''}
                onChange={(e) => handleCommentChange(currentQuestion.id, e.target.value)}
                placeholder="Add feedback for the student..."
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Evaluate;
