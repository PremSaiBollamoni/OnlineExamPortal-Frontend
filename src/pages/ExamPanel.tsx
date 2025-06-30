import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';
import { getExamPaper, submitExam } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, CheckCircle, ArrowLeft, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Question {
  _id: string;
  type: 'mcq' | 'subjective';
  question: string;
  options?: string[];
  marks: number;
}

interface Answer {
  questionIndex: number;
  selectedOption: string;
  question: string;
}

interface ExamPaper {
  _id: string;
  title: string;
  description?: string;
  subject: {
    _id: string;
    name: string;
  };
  duration: number;
  totalMarks: number;
  questions: Question[];
  isActive: boolean;
  isCompleted: boolean;
}

const ExamPanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuthContext();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState<Date>(new Date());

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !token) {
      navigate('/login', { state: { from: `/exam-panel/${id}` } });
    }
  }, [user, token, id, navigate]);

  // Fetch exam paper details
  const queryOptions: UseQueryOptions<ExamPaper, Error> = {
    queryKey: ['examPaper', id],
    queryFn: () => getExamPaper(id!),
    enabled: !!id && !!token,
    retry: 1,
  };

  const { data: examPaper, isLoading, error } = useQuery<ExamPaper, Error>(queryOptions);

  // Handle query errors
  useEffect(() => {
    if (error) {
      if ((error as any).response?.status === 401) {
        navigate('/login', { state: { from: `/exam-panel/${id}` } });
      } else {
        toast({
          title: 'Error',
          description: (error as any).response?.data?.message || 'Failed to load exam paper',
          variant: 'destructive',
        });
        navigate('/exams');
      }
    }
  }, [error, navigate, id, toast]);

  // Submit exam mutation
  const submitMutation = useMutation({
    mutationFn: submitExam,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Exam submitted successfully!',
      });
      // Clear local storage
      localStorage.removeItem(`exam_${id}_answers`);
      localStorage.removeItem(`exam_${id}_questionIndex`);
      localStorage.removeItem(`exam_${id}_timeLeft`);
      localStorage.removeItem(`exam_${id}_startTime`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      if (error.response?.status === 401) {
        navigate('/login', { state: { from: `/exam-panel/${id}` } });
      } else if (error.response?.status === 400 && error.response?.data?.message === 'You have already submitted this exam') {
        toast({
          title: 'Already Submitted',
          description: 'You have already submitted this exam. Redirecting to dashboard...',
          variant: 'default',
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to submit exam. Please try again.',
          variant: 'destructive',
        });
      }
    },
  });

  // Timer effect
  useEffect(() => {
    if (examPaper?.duration) {
      const duration = examPaper.duration * 60; // Convert to seconds
      setTimeLeft(duration);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(); // Auto-submit when time's up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Save timer state to localStorage
      localStorage.setItem(`exam_${id}_timeLeft`, duration.toString());
      localStorage.setItem(`exam_${id}_startTime`, startTime.toISOString());

      return () => {
        clearInterval(timer);
        localStorage.removeItem(`exam_${id}_timeLeft`);
        localStorage.removeItem(`exam_${id}_startTime`);
      };
    }
  }, [examPaper]);

  // Restore exam state from localStorage
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`exam_${id}_answers`);
    const savedQuestionIndex = localStorage.getItem(`exam_${id}_questionIndex`);
    
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }
    if (savedQuestionIndex) {
      setCurrentQuestionIndex(parseInt(savedQuestionIndex));
    }
  }, [id]);

  // Save exam state to localStorage
  useEffect(() => {
    localStorage.setItem(`exam_${id}_answers`, JSON.stringify(answers));
    localStorage.setItem(`exam_${id}_questionIndex`, currentQuestionIndex.toString());
  }, [answers, currentQuestionIndex, id]);

  // Format time left
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer changes
  const handleAnswerChange = (answer: string) => {
    const existingAnswerIndex = answers.findIndex(a => a.questionIndex === currentQuestionIndex);
    
    if (existingAnswerIndex !== -1) {
      const newAnswers = [...answers];
      newAnswers[existingAnswerIndex] = {
        questionIndex: currentQuestionIndex,
        selectedOption: answer,
        question: examPaper.questions[currentQuestionIndex]._id
      };
      setAnswers(newAnswers);
    } else {
      setAnswers([...answers, { 
        questionIndex: currentQuestionIndex,
        selectedOption: answer,
        question: examPaper.questions[currentQuestionIndex]._id
      }]);
    }
  };

  // Navigate between questions
  const handleNext = () => {
    if (currentQuestionIndex < examPaper.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit exam
  const handleSubmit = async () => {
    if (isSubmitting) {
      return; // Prevent multiple submissions
    }

    if (!user || !examPaper) {
      navigate('/login', { state: { from: `/exam-panel/${id}` } });
      return;
    }

    if (answers.length < examPaper.questions.length) {
      const confirmed = window.confirm('You have unanswered questions. Are you sure you want to submit?');
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    submitMutation.mutate({
      examPaper: examPaper._id,
      answers: answers.map(answer => ({
        questionIndex: answer.questionIndex,
        selectedOption: answer.selectedOption
      })),
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      isSubmitted: true
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !examPaper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load exam paper. Please try again later.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/exams')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = examPaper.questions[currentQuestionIndex];
  const progress = (answers.length / examPaper.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === examPaper.questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{examPaper.title}</h1>
            <p className="text-gray-600">
              {examPaper.subject.name} • Total Marks: {examPaper.totalMarks}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg py-2 px-4">
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(timeLeft)}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <Card className="bg-white shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {examPaper.questions.length}
              </Badge>
              <Badge variant="secondary">
                Marks: {currentQuestion.marks}
              </Badge>
            </div>
            <CardTitle className="text-lg mt-4">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.type === 'mcq' ? (
              <RadioGroup
                value={answers.find(a => a.questionIndex === currentQuestionIndex)?.selectedOption || ''}
                onValueChange={handleAnswerChange}
              >
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                value={answers.find(a => a.questionIndex === currentQuestionIndex)?.selectedOption || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[200px]"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            )}
          </div>
        </div>

        {/* Instructions Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important Notes</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Your answers are saved automatically when you change questions</li>
              <li>The exam will auto-submit when the timer reaches zero</li>
              <li>You can review and change your answers before final submission</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default ExamPanel; 