import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubmissions, submitToAdmin } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { Eye, Download, Search, Filter, FileText, Send } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from '@/hooks/use-toast';

interface Student {
  _id: string;
  name: string;
  studentId: string;
}

interface ExamPaper {
  _id: string;
  title: string;
  subject: string;
  totalMarks: number;
}

interface Submission {
  _id: string;
  student: Student;
  examPaper: ExamPaper;
  score: number;
  evaluatedAt: string;
  status: 'pending' | 'evaluated' | 'submitted_to_admin' | 'published';
}

const EvaluatedPapers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: getSubmissions
  });

  const submitToAdminMutation = useMutation({
    mutationFn: submitToAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast({
        title: "Success",
        description: "Submission sent to admin for review"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit to admin",
        variant: "destructive"
      });
    }
  });

  // Filter for evaluated submissions only
  const evaluatedSubmissions = submissions.filter(submission => 
    submission.status === 'evaluated'
  );

  // Get unique subjects for filter
  const subjects = [...new Set(evaluatedSubmissions.map(s => s.examPaper?.subject))].filter(Boolean);

  const calculateAverageScore = (submissions: Submission[]) => {
    if (!submissions.length) return 0;
    
    const validSubmissions = submissions.filter(sub => 
      typeof sub.score === 'number' && 
      sub.score !== null &&
      sub.examPaper?.totalMarks > 0
    );
    
    if (!validSubmissions.length) return 0;
    
    const totalPercentage = validSubmissions.reduce((acc, curr) => {
      if (curr.score === null || !curr.examPaper?.totalMarks) return acc;
      return acc + ((curr.score / curr.examPaper.totalMarks) * 100);
    }, 0);
    
    return Math.round(totalPercentage / validSubmissions.length);
  };

  const formatScore = (score: number | null, totalMarks: number) => {
    if (score === null || !totalMarks) return 'N/A';
    const percentage = Math.round((score / totalMarks) * 100);
    return `${score}/${totalMarks} (${percentage}%)`;
  };

  const getScoreColor = (score: number | null, totalMarks: number) => {
    if (score === null || !totalMarks) return 'text-gray-500';
    const percentage = (score / totalMarks) * 100;
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Apply filters and search
  const filteredSubmissions = evaluatedSubmissions.filter((submission: Submission) => {
    const matchesSearch = searchTerm === '' || 
      submission.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.examPaper?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = subjectFilter === 'all' || 
      submission.examPaper?.subject === subjectFilter;

    return matchesSearch && matchesSubject;
  });

  // Apply sorting
  const sortedSubmissions = [...filteredSubmissions].sort((a: Submission, b: Submission) => {
    switch (sortBy) {
      case 'score':
        return ((b.score || 0) / (b.examPaper?.totalMarks || 1)) - 
               ((a.score || 0) / (a.examPaper?.totalMarks || 1));
      case 'name':
        return (a.student?.name || '').localeCompare(b.student?.name || '');
      case 'subject':
        return (a.examPaper?.subject || '').localeCompare(b.examPaper?.subject || '');
      default: // 'recent'
        return new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime();
    }
  });

  const getStatusBadge = (status: Submission['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'submitted_to_admin':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Admin Review</Badge>;
      case 'evaluated':
        return <Badge className="bg-blue-100 text-blue-800">Evaluated</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleSubmitToAdmin = (submissionId: string) => {
    submitToAdminMutation.mutate(submissionId);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Evaluated Papers</h1>
          <p className="text-gray-600 mt-1">Review and manage evaluated submissions</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {evaluatedSubmissions.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {calculateAverageScore(evaluatedSubmissions)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Subjects Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(evaluatedSubmissions.map(s => s.examPaper.subject)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by student name, ID, or exam title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="score">Highest Score</SelectItem>
                <SelectItem value="name">Student Name</SelectItem>
                <SelectItem value="subject">Subject</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluated Submissions ({filteredSubmissions.length})</CardTitle>
          <CardDescription>
            Comprehensive list of all evaluated exam papers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6 text-gray-500">Loading evaluated papers...</div>
          ) : sortedSubmissions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No evaluated papers found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Exam Paper</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Evaluated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSubmissions.map((submission: Submission) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{submission.student?.name}</div>
                          <div className="text-sm text-gray-500">{submission.student?.studentId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{submission.examPaper?.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {submission.examPaper?.subject}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={getScoreColor(submission.score, submission.examPaper?.totalMarks || 0)}>
                          {formatScore(submission.score, submission.examPaper?.totalMarks || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(submission.evaluatedAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/faculty/submissions/${submission._id}/evaluate`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {submission.status === 'evaluated' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSubmitToAdmin(submission._id)}
                              disabled={submitToAdminMutation.isPending}
                              className="bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Submit to Admin
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluatedPapers; 