import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Check, X, Plus, Edit, FileText, Clock, CheckCircle2, XCircle, ArrowLeft, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { getPapers, updatePaper, approveExamPaper, rejectExamPaper } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/lib/auth-context';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Award } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  semester?: number;
  department?: string;
  specialization?: string;
}

interface Question {
  _id: string;
  question: string;
  type: 'mcq' | 'subjective';
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

interface Paper {
  _id: string;
  title: string;
  description: string;
  subject: {
    _id: string;
    name: string;
    semester: number;
    facultyId: string;
  };
  facultyId: {
    _id: string;
    name: string;
  };
  department: 'CSE' | 'MECH' | 'ECE' | 'BSc' | 'BBA';
  specialization: 'AIML' | 'DSML' | 'CSBS' | 'CN' | 'Forensic Science' | 'Anesthesia' | 'Radiology' | 'Optometry' | 'Pharmacy' | 'Agriculture' | 'No Specialization';
  duration: number;
  totalMarks: number;
  passingMarks: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  rejectionReason?: string;
  questions: Question[];
  instructions: string;
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  isSubmitted?: boolean;
  isAvailable?: boolean;
  scheduledDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const Papers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const subjectId = location.state?.subjectId;

  // Fetch papers
  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => getPapers()
  });

  // Debug logging
  React.useEffect(() => {
    if (user?.role === 'student') {
      console.log('Current user details:', {
        id: user._id,
        name: user.name,
        semester: user.semester,
        department: user.department,
        specialization: user.specialization,
        role: user.role
      });
      
      console.log('All papers before filtering:', papers);
    }
  }, [papers, user]);

  const goBack = () => {
    navigate(-1);
  };

  // Update paper mutation
  const updatePaperMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePaper(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast({
        title: "Success",
        description: "Paper updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update paper",
        variant: "destructive"
      });
    }
  });

  const approvePaperMutation = useMutation({
    mutationFn: approveExamPaper,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast({
        title: "Success",
        description: "Paper approved successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve paper",
        variant: "destructive"
      });
    }
  });

  const rejectPaperMutation = useMutation({
    mutationFn: (id: string) => rejectExamPaper(id, "Rejected by admin"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast({
        title: "Success",
        description: "Paper rejected successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject paper",
        variant: "destructive"
      });
    }
  });

  // Get unique subjects for filter
  const subjects = [...new Set(papers.map((paper: Paper) => paper.subject?.name))].filter(Boolean);

  // Filter papers based on search term and filters
  const filteredPapers = papers.filter((paper: Paper) => {
    const matchesSearch = searchTerm === '' || 
      paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = subjectFilter === 'all' || paper.subject?.name === subjectFilter;
    const matchesStatus = statusFilter === 'all' || paper.status === statusFilter;

    return matchesSearch && matchesSubject && matchesStatus;
  });

  const handleCreatePaper = () => {
    navigate('/faculty/papers/create');
  };

  const handleViewPaper = (id: string) => {
    navigate(`/faculty/papers/${id}`);
  };

  const handleApprovePaper = (id: string) => {
    approvePaperMutation.mutate(id);
  };

  const handleRejectPaper = (id: string) => {
    setSelectedPaperId(id);
    setRejectDialogOpen(true);
  };

  const submitRejection = async () => {
    if (!selectedPaperId || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    try {
      await rejectExamPaper(selectedPaperId, rejectionReason);
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast({
        title: "Success",
        description: "Paper rejected successfully"
      });
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedPaperId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject paper",
        variant: "destructive"
      });
    }
  };

  const handleEndExam = async (id: string) => {
    try {
      await updatePaper(id, { 
        status: 'completed',
        updatedAt: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast({
        title: "Success",
        description: "Exam ended successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to end exam",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getViewDetailsPath = (paperId: string) => {
    switch (user?.role) {
      case 'admin':
        return `/admin/papers/${paperId}`;
      case 'faculty':
        return `/faculty/papers/${paperId}`;
      case 'student':
        return `/papers/${paperId}`;
      default:
        return '/';
    }
  };

  const handleViewDetails = (paperId: string) => {
    const path = getViewDetailsPath(paperId);
    navigate(path);
  };

  const renderAdminView = (paper: Paper) => (
    <Card key={paper._id} className="hover:shadow-lg transition-shadow bg-gradient-to-br from-slate-50 to-gray-50">
      <CardHeader className="border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 break-words">{paper.title}</CardTitle>
            <CardDescription className="text-gray-600">
              Subject: {paper.subject.name} (Semester {paper.subject.semester})
            </CardDescription>
          </div>
          {getStatusBadge(paper.status)}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2 flex-shrink-0" />
              Faculty: {paper.facultyId.name}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Award className="h-4 w-4 mr-2 flex-shrink-0" />
              Total Marks: {paper.totalMarks}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              Duration: {paper.duration} minutes
            </div>
            {paper.scheduledDate && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                Scheduled: {format(new Date(paper.scheduledDate), 'PPp')}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(paper._id)}
            className="flex-shrink-0"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {paper.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApprovePaper(paper._id)}
                className="flex-shrink-0 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRejectPaper(paper._id)}
                className="flex-shrink-0 bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {paper.status === 'approved' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleEndExam(paper._id)}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4 mr-2" />
              End Exam
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderFacultyView = (paper: Paper) => (
    <Card key={paper._id} className="hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="border-b border-purple-100">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 break-words">{paper.title}</CardTitle>
            <CardDescription className="text-gray-600">
              Subject: {paper.subject.name} (Semester {paper.subject.semester})
            </CardDescription>
          </div>
          {getStatusBadge(paper.status)}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Award className="h-4 w-4 mr-2 flex-shrink-0" />
              Total Marks: {paper.totalMarks}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              Duration: {paper.duration} minutes
            </div>
          </div>
          {paper.scheduledDate && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                Scheduled: {format(new Date(paper.scheduledDate), 'PPp')}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-purple-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(paper._id)}
            className="flex-shrink-0"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={goBack}
              className="mb-2 sm:mb-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Exam Papers</h1>
          </div>
          <p className="text-gray-600 mt-1">
            {user?.role === 'admin' 
              ? 'Manage and approve exam papers'
              : user?.role === 'faculty'
              ? 'View and manage your exam papers'
              : 'View available exam papers'}
          </p>
        </div>
        {user?.role === 'faculty' && (
          <Button
            onClick={() => navigate('/create-paper')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Paper
          </Button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-[2fr,1fr]">
        <Input
          placeholder="Search papers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((subject: string) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading papers...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6">
            <div className="text-gray-500">No exam papers found</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
          {filteredPapers.map((paper: Paper) => (
            user?.role === 'admin' ? renderAdminView(paper) : renderFacultyView(paper)
          ))}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Exam Paper</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this exam paper.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter rejection reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
                setSelectedPaperId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitRejection}
              disabled={!rejectionReason.trim()}
            >
              Reject Paper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Papers;
