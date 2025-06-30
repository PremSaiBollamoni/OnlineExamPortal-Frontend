import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSubmissions, getExamPaper } from '@/lib/api';
import { useAuthContext } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Book, FileText, CheckCircle, XCircle, Award } from 'lucide-react';

// Updated interfaces to match backend models
interface Answer {
  questionIndex: number;
  selectedOption: string;
  marks?: number;
  comment?: string;
}

interface Question {
  _id: string;
  question: string;
  marks: number;
  type: 'mcq' | 'subjective';
  options?: string[];
}

const SubmissionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: getSubmissions,
  });

  // Find the specific submission
  const submission = submissions.find((sub: any) => sub._id === id);

  // Fetch the complete exam paper data
  const { data: examPaper, isLoading: isLoadingExamPaper } = useQuery({
    queryKey: ['examPaper', submission?.examPaper?._id],
    queryFn: () => getExamPaper(submission?.examPaper?._id),
    enabled: !!submission?.examPaper?._id,
  });

  const isLoading = isLoadingSubmissions || isLoadingExamPaper;

  // Debug logging
  console.log('Initial Debug Info:', {
    submissionId: id,
    foundSubmission: !!submission,
    hasExamPaper: !!examPaper,
    submissionStatus: submission?.status,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!submission || !examPaper) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              {!submission ? `Submission not found. ID: ${id}` : 'Loading exam paper details...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get questions and answers
  const questions = examPaper.questions || [];
  const answers = submission.answers || [];

  // Map answers by question index
  const answerMap = new Map<number, Answer>();
  answers.forEach((answer: Answer) => {
    if (answer && typeof answer.questionIndex === 'number') {
      answerMap.set(answer.questionIndex, answer);
    }
  });

  const totalQuestions = questions.length;
  const answeredQuestions = answers.filter((ans: Answer) => 
    ans && ans.selectedOption && typeof ans.selectedOption === 'string' && ans.selectedOption.trim() !== ''
  ).length;

  // Safe debug logging
  console.log('Detailed Debug Info:', {
    totalQuestions,
    answeredQuestions,
    questions: questions.map((q: Question, idx: number) => ({
      index: idx,
      id: q._id,
      marks: q.marks,
      text: q.question ? q.question.substring(0, 50) : 'No text'
    })),
    answers: answers.map((a: Answer) => ({
      questionIndex: a?.questionIndex,
      hasAnswer: !!(a?.selectedOption && typeof a.selectedOption === 'string' && a.selectedOption.trim()),
      answerPreview: a?.selectedOption ? a.selectedOption.substring(0, 50) : 'No answer',
      marks: a?.marks
    }))
  });

  const score = submission.score || 0;
  const totalMarks = examPaper?.totalMarks || 0;
  const scorePercentage = totalMarks ? Math.round((score / totalMarks) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold">{examPaper?.title}</h1>
        <p className="mt-2 text-purple-100">{examPaper?.description}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-blue-800">Questions</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {answeredQuestions}/{totalQuestions}
            </div>
            <p className="text-sm text-blue-600">Questions Attempted</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-green-800">Score</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {score}/{totalMarks} ({scorePercentage}%)
            </div>
            <p className="text-sm text-green-600">Total Score</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-purple-800">Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              <Badge className={
                submission.status === 'published' ? 'bg-green-100 text-green-800' :
                submission.status === 'evaluated' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }>
                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions and Answers */}
      <Card className="mt-6">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle>Questions and Answers</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {questions.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              <p>No questions found in this exam paper.</p>
              <p className="text-sm mt-2">Please contact your administrator.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {questions.map((question: Question, index: number) => {
                const answer = answerMap.get(index);
                const hasAnswer = answer && answer.selectedOption && typeof answer.selectedOption === 'string' && answer.selectedOption.trim() !== '';
                
                return (
                  <div key={question._id} className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-gray-900">Question {index + 1}</h3>
                          <Badge variant="outline" className="ml-2">
                            {question.marks} marks
                          </Badge>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{question.question || 'Question text not available'}</p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-md ${hasAnswer ? 'bg-gray-50' : 'bg-red-50'}`}>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Your Answer:</h4>
                      <p className={`whitespace-pre-wrap ${hasAnswer ? 'text-gray-800' : 'text-red-600 italic'}`}>
                        {hasAnswer ? answer.selectedOption : 'Not answered'}
                      </p>
                      {answer?.marks !== undefined && answer?.marks !== null && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm font-medium text-gray-700">
                            Marks: <span className="font-bold">{answer.marks}</span>
                          </p>
                          {answer.comment && (
                            <p className="mt-1 text-sm text-gray-600">
                              Feedback: {answer.comment}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionDetails;