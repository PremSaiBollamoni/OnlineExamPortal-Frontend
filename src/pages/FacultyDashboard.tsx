import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, ClipboardCheck, Clock, Plus, Eye, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getExamPapers, getSubmissions, getSubjects } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuthContext } from '@/lib/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface Subject {
  _id: string;
  name: string;
  faculty: string;
  facultyId: {
    _id: string;
    name: string;
  };
  school: 'SOET' | 'SoPHAS' | 'SoM';
  department: 'CSE' | 'MECH' | 'ECE' | 'BSc' | 'BBA';
  specialization: string;
  semester: number;
}

interface ExamPaper {
  _id: string;
  title: string;
  subject: {
    _id: string;
    name: string;
  };
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  duration: number;
  createdAt: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface Submission {
  _id: string;
  examPaper: ExamPaper;
  status: 'pending' | 'evaluated' | 'submitted_to_admin' | 'published';
  student: {
    _id: string;
    name: string;
  };
  isSubmitted: boolean;
}

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Fetch data
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: getSubjects
  });

  const { data: examPapers = [], isLoading: isLoadingExams } = useQuery<ExamPaper[]>({
    queryKey: ['examPapers'],
    queryFn: getExamPapers
  });

  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: getSubmissions
  });

  // Filter subjects for the current faculty
  const facultySubjects = subjects.filter(
    (subject) => subject.facultyId._id === user?._id
  );

  // Filter papers for the current faculty's subjects
  const facultyPapers = examPapers.filter(
    (paper) => facultySubjects.some(subject => subject._id === paper.subject._id)
  );

  // Get submissions for faculty's papers
  const facultySubmissions = submissions.filter(
    (sub) => facultyPapers.some(paper => paper._id === sub.examPaper._id)
  );

  // Calculate stats
  const stats = [
    { 
      title: 'My Subjects', 
      value: facultySubjects.length.toString(), 
      icon: GraduationCap 
    },
    { 
      title: 'Created Papers', 
      value: facultyPapers.length.toString(), 
      icon: BookOpen 
    },
    { 
      title: 'Active Exams', 
      value: facultyPapers.filter(paper => paper.isActive && !paper.isCompleted).length.toString(), 
      icon: Clock 
    },
    { 
      title: 'Pending Evaluations', 
      value: facultySubmissions.filter(sub => 
        sub.status === 'pending'
      ).length.toString(), 
      icon: ClipboardCheck 
    },
  ];

  // Format papers data with submission counts
  const recentPapers = facultyPapers.map((paper) => {
    const paperSubmissions = facultySubmissions.filter(sub => sub.examPaper._id === paper._id);
    return {
      id: paper._id,
      title: paper.title,
      subject: paper.subject?.name || 'Unknown Subject',
      status: paper.status || 'draft',
      students: paperSubmissions.length,
      submitted: paperSubmissions.length,
      duration: paper.duration,
      created: formatDistanceToNow(new Date(paper.createdAt), { addSuffix: true })
    };
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return null;
    }
  };

  const handleCreateExam = (subjectId: string) => {
    navigate('/faculty/papers/create', { state: { subjectId } });
    setIsCreateDialogOpen(false);
  };

  if (isLoadingSubjects || isLoadingExams || isLoadingSubmissions) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
          </div>
          <Button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 w-full sm:w-auto opacity-50"
            disabled
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            View Pending Evaluations
          </Button>
        </div>

        {/* Stats Overview Loading State */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'My Subjects', icon: GraduationCap },
            { title: 'Created Papers', icon: BookOpen },
            { title: 'Active Exams', icon: Clock },
            { title: 'Pending Evaluations', icon: ClipboardCheck }
          ].map((stat, index) => (
            <Card key={index} className="bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                <CardTitle className="text-sm font-medium truncate">{stat.title}</CardTitle>
                {React.createElement(stat.icon, { className: "h-4 w-4 text-purple-400 flex-shrink-0" })}
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="h-8 w-16 bg-purple-100 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My Subjects Section Loading State */}
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>My Subjects</CardTitle>
                <CardDescription>Subjects assigned to you</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((_, index) => (
                <Card key={index} className="bg-white">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col gap-2">
                      <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-4 w-1/4 bg-gray-100 animate-pulse rounded"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((_, i) => (
                          <div key={i} className="h-6 w-20 bg-gray-100 animate-pulse rounded"></div>
                        ))}
                      </div>
                      <div className="h-8 w-full bg-gray-50 animate-pulse rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 w-full sm:w-auto"
          onClick={() => navigate('/faculty/submissions')}
        >
          <ClipboardCheck className="h-4 w-4 mr-2" />
          View Pending Evaluations
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
              <CardTitle className="text-sm font-medium truncate">{stat.title}</CardTitle>
              {React.createElement(stat.icon, { className: "h-4 w-4 text-purple-600 flex-shrink-0" })}
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-purple-700">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Subjects Section */}
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>My Subjects</CardTitle>
              <CardDescription>Subjects assigned to you</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSubjects ? (
            <div className="text-center py-6 text-gray-500">Loading subjects...</div>
          ) : facultySubjects.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No subjects assigned yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facultySubjects.map((subject) => (
                <Card key={subject._id} className="bg-white">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <CardTitle className="text-lg font-semibold break-words">{subject.name}</CardTitle>
                      <Badge variant="secondary" className="mt-2 sm:mt-0">{subject.school}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-blue-100 text-blue-800">{subject.department}</Badge>
                        <Badge className="bg-purple-100 text-purple-800">
                          {subject.specialization === 'No Specialization' ? 'General' : subject.specialization}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800">Semester {subject.semester}</Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/faculty/papers?subject=${subject._id}`)}
                          className="flex-1 sm:flex-none justify-center"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Papers
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex-1 sm:flex-none justify-center"
                          size="sm"
                          onClick={() => handleCreateExam(subject._id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Exam
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Papers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Papers</CardTitle>
              <CardDescription>Manage your exam papers and their status</CardDescription>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Paper
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPapers.map((paper) => (
              <div
                key={paper.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-white gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{paper.title}</h3>
                    {getStatusBadge(paper.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{paper.subject}</span>
                    <span>{paper.duration} minutes</span>
                    <span>{paper.submitted}/{paper.students} submitted</span>
                    <span>Created {paper.created}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/faculty/papers/${paper.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
            {recentPapers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No exam papers created yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Paper Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Exam Paper</DialogTitle>
            <DialogDescription>
              Select a subject to create a new exam paper
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {facultySubjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleCreateExam(selectedSubject)}
                disabled={!selectedSubject}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Create Paper
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyDashboard;
