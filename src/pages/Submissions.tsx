import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Download, Clock, CheckCircle, Search, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSubmissions } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import Evaluate from './Evaluate';

const Submissions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: getSubmissions
  });

  // Debug log
  console.log('Submissions data:', submissions);

  // Filter for unevaluated submissions
  const pendingSubmissions = submissions.filter((submission: any) => submission.status === 'pending');

  const getStatusBadge = (status: string, needsReview: boolean) => {
    if (status === 'evaluated') {
      return <Badge className="bg-green-100 text-green-800">Evaluated</Badge>;
    }
    if (needsReview) {
      return <Badge className="bg-yellow-100 text-yellow-800">Needs Review</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Auto-Graded</Badge>;
  };

  const filteredSubmissions = submissions.filter((submission: any) => {
    const matchesSearch = submission.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.examPaper.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && submission.status === 'pending') ||
                         (statusFilter === 'evaluated' && ['evaluated', 'submitted_to_admin', 'published'].includes(submission.status)) ||
                         (statusFilter === 'review' && submission.status === 'pending' && submission.needsManualReview);
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: submissions.length,
    evaluated: submissions.filter((s: any) => s.status === 'evaluated' || s.status === 'submitted_to_admin' || s.status === 'published').length,
    pending: submissions.filter((s: any) => s.status === 'pending').length,
    needsReview: submissions.filter((s: any) => s.status === 'pending' && s.needsManualReview).length
  };

  const formatSubmissionDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (selectedSubmission) {
    return <Evaluate submissionId={selectedSubmission} onClose={() => setSelectedSubmission(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Evaluations</h1>
          <p className="text-gray-600 mt-1">Review and grade submitted exams</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Exams</CardTitle>
          <CardDescription>
            Exams waiting for evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6 text-gray-500">Loading submissions...</div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No pending submissions to evaluate</div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((submission: any) => (
                <div
                  key={submission._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{submission.examPaper?.title || 'Untitled Exam'}</h3>
                      <Badge variant="outline">{submission.examPaper?.subject?.name || 'No Subject'}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span>Student: {submission.student?.name || 'Unknown'} ({submission.student?.studentId || 'No ID'})</span>
                      <span>•</span>
                      <span>Submitted {formatSubmissionDate(submission.submittedAt)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/evaluate/${submission._id}`)}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Evaluate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Submissions;
