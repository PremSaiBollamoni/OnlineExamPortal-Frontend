import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Download, Search, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubmissions, publishResult } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminResults = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: getSubmissions
  });

  const publishMutation = useMutation({
    mutationFn: publishResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast({
        title: "Result Published",
        description: "The result has been published successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to publish result",
        variant: "destructive"
      });
    }
  });

  // Filter for submissions sent to admin
  const pendingSubmissions = submissions.filter((submission: any) => 
    submission.status === 'submitted_to_admin'
  );

  const filteredSubmissions = pendingSubmissions.filter((submission: any) => 
    searchTerm === '' || 
    submission.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.examPaper?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePublish = (submissionId: string) => {
    publishMutation.mutate(submissionId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'submitted_to_admin':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Results Management</h1>
        <p className="text-gray-600 mt-1">Review and publish evaluated exam results</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {pendingSubmissions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by student name, ID, or exam title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Results ({filteredSubmissions.length})</CardTitle>
          <CardDescription>Review and publish evaluated exam results</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6 text-gray-500">Loading submissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No pending results to review</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Exam Paper</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Evaluated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission: any) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{submission.student?.name}</div>
                          <div className="text-sm text-gray-500">{submission.student?.studentId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{submission.examPaper?.title}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {submission.score}/{submission.examPaper?.totalMarks}
                          <span className="text-sm ml-1">
                            ({Math.round((submission.score / submission.examPaper?.totalMarks) * 100)}%)
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(submission.evaluatedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/faculty/submissions/${submission._id}/evaluate`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublish(submission._id)}
                            disabled={publishMutation.isPending}
                            className="bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
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

export default AdminResults;
