import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getSubjects, createExamPaper } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Eye, FileText, Clock, ArrowLeft } from 'lucide-react';

interface Question {
  id: number;
  type: 'mcq' | 'subjective';
  question: string;
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

const CreatePaper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const subjectId = location.state?.subjectId;

  const [examDetails, setExamDetails] = useState({
    title: '',
    duration: '',
    totalMarks: 0,
    passingMarks: '',
    description: '',
    instructions: ''
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'mcq',
    question: '',
    options: ['', '', '', ''],
    marks: 1
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects
  });

  const subject = subjects.find((s: any) => s._id === subjectId);

  useEffect(() => {
    if (!subjectId) {
      toast({
        title: "Error",
        description: "No subject selected. Please select a subject first.",
        variant: "destructive"
      });
      navigate('/faculty/dashboard');
      return;
    }

    if (subject) {
      // Auto-generate exam title based on subject
      const defaultTitle = `${subject.name} - Semester ${subject.semester} Exam`;
      setExamDetails(prev => ({ ...prev, title: defaultTitle }));
    }
  }, [subjectId, subject, navigate, toast]);

  const addQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.marks) {
      toast({
        title: "Incomplete Question",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (currentQuestion.type === 'mcq') {
      const hasEmptyOptions = currentQuestion.options?.some(opt => !opt.trim());
      if (hasEmptyOptions || !currentQuestion.correctAnswer) {
        toast({
          title: "Incomplete MCQ",
          description: "Please fill all options and select correct answer",
          variant: "destructive"
        });
        return;
      }
    }

    const newQuestion: Question = {
      id: Date.now(),
      type: currentQuestion.type as 'mcq' | 'subjective',
      question: currentQuestion.question,
      options: currentQuestion.type === 'mcq' ? currentQuestion.options : undefined,
      correctAnswer: currentQuestion.type === 'mcq' ? currentQuestion.correctAnswer : undefined,
      marks: currentQuestion.marks || 1
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      type: 'mcq',
      question: '',
      options: ['', '', '', ''],
      marks: 1
    });

    setExamDetails(prev => ({
      ...prev,
      totalMarks: prev.totalMarks + newQuestion.marks
    }));

    toast({
      title: "Question Added",
      description: "Question has been added to the exam paper"
    });
  };

  const removeQuestion = (id: number) => {
    const questionToRemove = questions.find(q => q.id === id);
    setQuestions(questions.filter(q => q.id !== id));
    
    if (questionToRemove) {
      setExamDetails(prev => ({
        ...prev,
        totalMarks: prev.totalMarks - questionToRemove.marks
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examDetails.title || questions.length === 0) {
      toast({
        title: "Incomplete Paper",
        description: "Please fill in all exam details and add at least one question",
        variant: "destructive"
      });
      return;
    }

    try {
      const paperData = {
        title: examDetails.title,
        description: examDetails.description,
        subject: subjectId,
        duration: parseInt(examDetails.duration),
        totalMarks: examDetails.totalMarks,
        passingMarks: parseInt(examDetails.passingMarks),
        questions: questions.map(q => ({
          type: q.type,
          question: q.question,
          options: q.type === 'mcq' ? q.options : undefined,
          correctAnswer: q.type === 'mcq' ? q.correctAnswer : undefined,
          marks: q.marks
        })),
        instructions: examDetails.instructions
      };

      await createExamPaper(paperData);
      
      toast({
        title: "Success",
        description: "Exam paper created successfully!",
      });
      navigate('/faculty/papers');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create exam paper. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || ['', '', '', ''])];
    newOptions[index] = value;
    setCurrentQuestion({...currentQuestion, options: newOptions});
  };

  if (!subject) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/faculty/dashboard')}
            className="rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Exam Paper</h1>
            <p className="text-gray-600 mt-1">Creating exam for {subject.name}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Questions</p>
                  <p className="text-2xl font-bold text-blue-800">{questions.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Marks</p>
                  <p className="text-2xl font-bold text-green-800">{examDetails.totalMarks}</p>
                </div>
                <Badge className="bg-green-600">{examDetails.totalMarks}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Duration</p>
                  <p className="text-2xl font-bold text-purple-800">{examDetails.duration || '0'} min</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">MCQ Questions</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {questions.filter(q => q.type === 'mcq').length}
                  </p>
                </div>
                <Badge className="bg-orange-600">MCQ</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Details */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="text-purple-800">Exam Configuration</CardTitle>
            <CardDescription>Set up the basic information for your examination</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title</Label>
                <Input
                  id="title"
                  value={examDetails.title}
                  onChange={(e) => setExamDetails({...examDetails, title: e.target.value})}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={examDetails.duration}
                  onChange={(e) => setExamDetails({...examDetails, duration: e.target.value})}
                  placeholder="120"
                  className="h-11"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing Marks</Label>
                <Input
                  id="passingMarks"
                  type="number"
                  value={examDetails.passingMarks}
                  onChange={(e) => setExamDetails({...examDetails, passingMarks: e.target.value})}
                  placeholder="40"
                  className="h-11"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input value={examDetails.totalMarks} disabled className="h-11 bg-gray-50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={examDetails.description}
                onChange={(e) => setExamDetails({...examDetails, description: e.target.value})}
                placeholder="Enter exam description..."
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={examDetails.instructions}
                onChange={(e) => setExamDetails({...examDetails, instructions: e.target.value})}
                placeholder="Enter exam instructions for students..."
                className="resize-none"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Question Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Question</CardTitle>
            <CardDescription>Create a new question for the exam paper</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={currentQuestion.type}
                  onValueChange={(value) => {
                    setCurrentQuestion({
                      type: value as 'mcq' | 'subjective',
                      question: '',
                      options: value === 'mcq' ? ['', '', '', ''] : undefined,
                      marks: 1
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="subjective">Subjective</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Question Text</Label>
                <Textarea
                  placeholder="Enter your question here"
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                />
              </div>

              {currentQuestion.type === 'mcq' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentQuestion({
                              ...currentQuestion,
                              correctAnswer: String(index)
                            });
                          }}
                          className={
                            currentQuestion.correctAnswer === String(index)
                              ? 'bg-green-100 hover:bg-green-200 text-green-700'
                              : ''
                          }
                        >
                          Correct
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Marks</Label>
                <Input
                  type="number"
                  min="1"
                  value={currentQuestion.marks}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) || 1 })}
                />
              </div>

              <Button
                type="button"
                onClick={addQuestion}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        {questions.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="text-blue-800">Questions Preview ({questions.length})</CardTitle>
              <CardDescription>Review and manage your exam questions</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-gray-900 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <Badge variant={question.type === 'mcq' ? 'default' : 'secondary'} className="px-3 py-1">
                          {question.type === 'mcq' ? 'Multiple Choice' : 'Subjective'}
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1">
                          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-800 leading-relaxed">{question.question}</p>
                    </div>
                    
                    {question.type === 'mcq' && question.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`text-sm p-3 rounded-lg border transition-colors ${
                              option === question.correctAnswer
                                ? 'bg-green-50 border-green-200 text-green-800 font-medium'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            variant="outline"
            onClick={() => navigate('/faculty/dashboard')}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-6"
            disabled={questions.length === 0}
          >
            Create Exam Paper
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreatePaper;
