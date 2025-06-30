import React, { useEffect, useState, useRef } from 'react';
import { getUsers, createUser, updateUser, deleteUser, bulkCreateUsers, bulkDeleteUsers } from '../lib/api';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from '../hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, UserPlus, Users as UsersIcon, School, BookOpen, Upload, Trash2 } from 'lucide-react';
import { COLLEGE_STRUCTURE } from '@/lib/constants';
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type SchoolType = keyof typeof COLLEGE_STRUCTURE;
type DepartmentType = 'CSE' | 'MECH' | 'ECE' | 'BSc' | 'BBA';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  school: string;
  specialization?: string;
  semester?: number;
  studentId?: string;
  facultyId?: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state for dynamic dropdowns
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | ''>('');
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType | ''>('');

  // Get available departments for selected school
  const getAvailableDepartments = (school: string) => {
    if (school in COLLEGE_STRUCTURE) {
      return Object.keys(COLLEGE_STRUCTURE[school as SchoolType].departments);
    }
    return [];
  };

  // Get available specializations for selected department
  const getAvailableSpecializations = (school: string, department: string) => {
    if (school in COLLEGE_STRUCTURE && department in COLLEGE_STRUCTURE[school as SchoolType].departments) {
      return COLLEGE_STRUCTURE[school as SchoolType].departments[department as DepartmentType].specializations;
    }
    return [];
  };

  // Get available semesters for selected school
  const getAvailableSemesters = (school: string) => {
    if (school in COLLEGE_STRUCTURE) {
      return Array.from({ length: COLLEGE_STRUCTURE[school as SchoolType].semesters }, (_, i) => i + 1);
    }
    return [];
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddUser = async (formData: any) => {
    try {
      await createUser(formData);
      setIsAddUserOpen(false);
      fetchUsers();
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateUser = async (id: string, formData: any) => {
    try {
      await updateUser(id, formData);
      fetchUsers();
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(id);
      fetchUsers();
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size should be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      // Read and validate the file content first
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });

      // Validate JSON content
      try {
        const jsonContent = JSON.parse(fileContent);
        if (!Array.isArray(jsonContent)) {
          throw new Error('File content must be an array of users');
        }
        console.log('Valid JSON content with', jsonContent.length, 'records');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Invalid JSON format in file',
          variant: 'destructive',
        });
        return;
      }

      // Show loading toast
      toast({
        title: 'Uploading...',
        description: 'Please wait while we process your file',
      });

      try {
        await bulkCreateUsers(file);
        await fetchUsers();
        toast({
          title: 'Success',
          description: 'Users imported successfully',
        });
      } catch (error: any) {
        console.error('File upload error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to import users',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('File handling error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process the file',
        variant: 'destructive',
      });
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteUsers(selectedUsers);
      setSelectedUsers([]);
      fetchUsers();
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Success',
        description: `Successfully deleted ${selectedUsers.length} users`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Filter users based on all criteria
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      searchTerm === '' ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.studentId && user.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.facultyId && user.facultyId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSchool = schoolFilter === 'all' || user.school === schoolFilter;
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
    const matchesSpecialization = 
      specializationFilter === 'all' || 
      user.specialization === specializationFilter;
    const matchesSemester = 
      semesterFilter === 'all' || 
      user.semester?.toString() === semesterFilter;

    return (
      matchesSearch &&
      matchesRole &&
      matchesSchool &&
      matchesDepartment &&
      matchesSpecialization &&
      matchesSemester
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Update toggleSelectAll to use filtered users
  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    faculty: users.filter(u => u.role === 'faculty').length,
    departments: [...new Set(users.map(u => u.department))].length
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'faculty':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'student':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button
            onClick={() => setIsAddUserOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <div className="relative w-full sm:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,.csv"
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto border-dashed border-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Users
            </Button>
          </div>
          {selectedUsers.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <Card className="border-2 border-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">School</label>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {Object.keys(COLLEGE_STRUCTURE).map((school) => (
                    <SelectItem key={school} value={school}>
                      {school}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {schoolFilter !== 'all' &&
                    getAvailableDepartments(schoolFilter).map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Specialization</label>
              <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {schoolFilter !== 'all' &&
                    departmentFilter !== 'all' &&
                    getAvailableSpecializations(schoolFilter, departmentFilter).map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Semester</label>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {schoolFilter !== 'all' &&
                    getAvailableSemesters(schoolFilter).map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-2 border-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              <span>Users</span>
            </div>
            <Badge variant="outline" className="ml-2">
              {filteredUsers.length} of {users.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={currentUsers.length > 0 && selectedUsers.length === currentUsers.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead className="w-[100px]">Role</TableHead>
                    <TableHead className="w-[200px]">Email</TableHead>
                    <TableHead className="w-[150px]">School</TableHead>
                    <TableHead className="w-[150px]">Department</TableHead>
                    <TableHead className="w-[150px]">Specialization</TableHead>
                    <TableHead className="w-[100px]">Semester</TableHead>
                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((user) => (
                    <TableRow key={user._id} className="hover:bg-muted/50">
                      <TableCell className="w-[50px]">
                        <Checkbox
                          checked={selectedUsers.includes(user._id)}
                          onCheckedChange={() => toggleSelectUser(user._id)}
                        />
                      </TableCell>
                      <TableCell className="w-[200px] font-medium">{user.name}</TableCell>
                      <TableCell className="w-[100px]">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[200px]">{user.email}</TableCell>
                      <TableCell className="w-[150px]">{user.school}</TableCell>
                      <TableCell className="w-[150px]">{user.department}</TableCell>
                      <TableCell className="w-[150px]">{user.specialization || '-'}</TableCell>
                      <TableCell className="w-[100px]">{user.semester || '-'}</TableCell>
                      <TableCell className="w-[150px] text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateUser(user._id, {})}
                            className="hover:bg-muted"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              handleAddUser(data);
            }}
            className="space-y-4"
          >
            <Input name="name" placeholder="Name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              required
            />
            <Select name="role" required>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              name="school" 
              required
              value={selectedSchool}
              onValueChange={(value: SchoolType) => {
                setSelectedSchool(value);
                setSelectedDepartment('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select School" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COLLEGE_STRUCTURE).map(([code, school]) => (
                  <SelectItem key={code} value={code}>{school.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              name="department" 
              required
              value={selectedDepartment}
              onValueChange={(value: DepartmentType) => setSelectedDepartment(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {selectedSchool && getAvailableDepartments(selectedSchool).map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {COLLEGE_STRUCTURE[selectedSchool].departments[dept as DepartmentType].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="specialization">
              <SelectTrigger>
                <SelectValue placeholder="Select Specialization" />
              </SelectTrigger>
              <SelectContent>
                {selectedSchool && selectedDepartment && 
                  getAvailableSpecializations(selectedSchool, selectedDepartment).map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <Select name="semester">
              <SelectTrigger>
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                {selectedSchool && getAvailableSemesters(selectedSchool).map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input name="studentId" placeholder="Student ID (for students)" />
            <Input name="facultyId" placeholder="Faculty ID (for faculty)" />
            <Button type="submit">Add User</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUsers.length} selected users? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
