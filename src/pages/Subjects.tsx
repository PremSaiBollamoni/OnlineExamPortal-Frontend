import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, BookOpen, GraduationCap, School } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getSubjects, createSubject, deleteSubject, getFacultyUsers } from '@/lib/api';
import { COLLEGE_STRUCTURE } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';

const Subjects = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    faculty: '',
    facultyId: '',
    school: '',
    department: '',
    specialization: '',
    semester: ''
  });

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects
  });

  const { data: facultyUsers = [], isLoading: isLoadingFaculty } = useQuery({
    queryKey: ['faculty'],
    queryFn: getFacultyUsers
  });

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({
        title: "Subject Added",
        description: "The subject has been added successfully"
      });
      setIsAddDialogOpen(false);
      setNewSubject({
        name: '',
        faculty: '',
        facultyId: '',
        school: '',
        department: '',
        specialization: '',
        semester: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add subject",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({
        title: "Subject Deleted",
        description: "The subject has been deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete subject",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setNewSubject(prev => {
      const updates: any = { [field]: value };
      
      // Reset dependent fields when school or department changes
      if (field === 'school') {
        updates.department = '';
        updates.specialization = '';
        updates.semester = '';
      } else if (field === 'department') {
        updates.specialization = '';
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleFacultyChange = (facultyId: string) => {
    const selectedFaculty = facultyUsers.find((f: any) => f._id === facultyId);
    if (selectedFaculty) {
      setNewSubject(prev => ({
        ...prev,
        facultyId,
        faculty: selectedFaculty.name
      }));
    }
  };

  const handleAddSubject = () => {
    createMutation.mutate(newSubject);
  };

  const handleDeleteSubject = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Get available departments for selected school
  const getAvailableDepartments = () => {
    if (newSubject.school && newSubject.school in COLLEGE_STRUCTURE) {
      return Object.entries(COLLEGE_STRUCTURE[newSubject.school as keyof typeof COLLEGE_STRUCTURE].departments);
    }
    return [];
  };

  // Get available specializations for selected department
  const getAvailableSpecializations = () => {
    if (newSubject.school && newSubject.department && 
        newSubject.school in COLLEGE_STRUCTURE && 
        newSubject.department in COLLEGE_STRUCTURE[newSubject.school as keyof typeof COLLEGE_STRUCTURE].departments) {
      return COLLEGE_STRUCTURE[newSubject.school as keyof typeof COLLEGE_STRUCTURE]
        .departments[newSubject.department as keyof typeof COLLEGE_STRUCTURE[keyof typeof COLLEGE_STRUCTURE]['departments']]
        .specializations;
    }
    return [];
  };

  // Get available semesters for selected school
  const getAvailableSemesters = () => {
    if (newSubject.school && newSubject.school in COLLEGE_STRUCTURE) {
      const totalSemesters = COLLEGE_STRUCTURE[newSubject.school as keyof typeof COLLEGE_STRUCTURE].semesters;
      return Array.from({ length: totalSemesters }, (_, i) => (i + 1).toString());
    }
    return [];
  };

  // Get unique counts for stats
  const uniqueDepartments = new Set(subjects.map((s: any) => s.department)).size;
  const uniqueSpecializations = new Set(subjects.map((s: any) => s.specialization)).size;

  const navigate = useNavigate();

  const handleViewPapers = (subjectId: string) => {
    navigate('/papers', { state: { subjectId } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subjects Management</h1>
          <p className="text-gray-600 mt-1">Add and manage course subjects</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new subject to the curriculum.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  placeholder="Enter subject name"
                  value={newSubject.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty</Label>
                <Select value={newSubject.facultyId} onValueChange={handleFacultyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty member" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingFaculty ? (
                      <SelectItem value="loading" disabled>Loading faculty...</SelectItem>
                    ) : facultyUsers.length === 0 ? (
                      <SelectItem value="none" disabled>No faculty members found</SelectItem>
                    ) : (
                      facultyUsers.map((faculty: any) => (
                        <SelectItem key={faculty._id} value={faculty._id}>
                          {faculty.name} ({faculty.facultyId})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Select value={newSubject.school} onValueChange={(value) => handleInputChange('school', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COLLEGE_STRUCTURE).map(([code, school]) => (
                        <SelectItem key={code} value={code}>{school.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={newSubject.department} 
                    onValueChange={(value) => handleInputChange('department', value)}
                    disabled={!newSubject.school}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDepartments().map(([code, dept]) => (
                        <SelectItem key={code} value={code}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Select 
                    value={newSubject.specialization} 
                    onValueChange={(value) => handleInputChange('specialization', value)}
                    disabled={!newSubject.department}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSpecializations().map((spec) => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select 
                    value={newSubject.semester} 
                    onValueChange={(value) => handleInputChange('semester', value)}
                    disabled={!newSubject.school}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSemesters().map((sem) => (
                        <SelectItem key={sem} value={sem}>Semester {sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={handleAddSubject}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Adding...' : 'Add Subject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{subjects.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <School className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{uniqueDepartments}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Specializations</CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{uniqueSpecializations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject Name</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject: any) => (
              <TableRow key={subject._id}>
                <TableCell className="font-medium">{subject.name}</TableCell>
                <TableCell>{subject.faculty}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{subject.school}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-blue-100 text-blue-800">{subject.department}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-purple-100 text-purple-800">{subject.specialization || 'None'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800">Semester {subject.semester}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSubject(subject._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject: any) => (
          <Card key={subject._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{subject.name}</CardTitle>
              <CardDescription>
                {subject.department} - Semester {subject.semester}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <School className="h-4 w-4 mr-2" />
                  School: {subject.school}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Faculty: {subject.faculty}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPapers(subject._id)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Papers
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Subjects; 