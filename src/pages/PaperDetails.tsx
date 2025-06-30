import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPaper } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Award, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useAuthContext } from '@/lib/auth-context';

const PaperDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const { data: paper, isLoading } = useQuery({
    queryKey: ['paper', id],
    queryFn: () => getPaper(id as string)
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Completed</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!paper) {
    return <div>Paper not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Paper Details</h1>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{paper.title}</CardTitle>
              <CardDescription>
                Subject: {paper.subject.name} (Semester {paper.subject.semester})
              </CardDescription>
            </div>
            {getStatusBadge(paper.status)}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                <span>Faculty: {paper.facultyId.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-gray-500" />
                <span>Total Marks: {paper.totalMarks}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span>Duration: {paper.duration} minutes</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Instructions</h3>
                <p className="text-gray-600">{paper.instructions}</p>
              </div>
              {paper.scheduledDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>Scheduled for: {format(new Date(paper.scheduledDate), 'PPp')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-medium mb-4">Questions</h3>
            <div className="space-y-6">
              {paper.questions.map((question, index) => (
                <Card key={question._id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="font-medium">Question {index + 1}</div>
                        <div className="text-gray-600">{question.question}</div>
                        {question.type === 'mcq' && question.options && (
                          <div className="mt-2 space-y-1">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge>{question.marks} marks</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaperDetails; 