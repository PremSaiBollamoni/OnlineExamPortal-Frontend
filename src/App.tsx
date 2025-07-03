import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { SocketProvider } from "@/lib/socket-context";
import { queryClient } from "./lib/api";
import Index from "./pages/Index";
import Login from "./pages/Login";
import FacultyLogin from "./pages/FacultyLogin";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Exams from "./pages/Exams";
import Results from "./pages/Results";
import ExamHistory from "./pages/ExamHistory";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import CreatePaper from "./pages/CreatePaper";
import Submissions from "./pages/Submissions";
import Evaluate from "./pages/Evaluate";
import Users from "./pages/Users";
import Papers from "./pages/Papers";
import PaperDetails from "./pages/PaperDetails";
import Activities from "./pages/Activities";
import AdminResults from "./pages/AdminResults";
import Subjects from "./pages/Subjects";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";
import ExamPanel from "./pages/ExamPanel";
import EvaluatedSubmissions from "./pages/EvaluatedSubmissions";
import ProtectedRoute from './components/ProtectedRoute';
import Analytics from './pages/Analytics';
import SubmissionDetails from './pages/SubmissionDetails';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/faculty/login" element={<FacultyLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Student Routes */}
              <Route element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/exams" element={<Exams />} />
                <Route path="/exam-panel/:id" element={<ExamPanel />} />
                <Route path="/results" element={<Results />} />
                <Route path="/exam-history" element={<ExamHistory />} />
                <Route path="/submissions/:id" element={<SubmissionDetails />} />
              </Route>
              
              {/* Faculty Routes */}
              <Route path="/faculty" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<FacultyDashboard />} />
                <Route path="papers" element={<Papers />} />
                <Route path="papers/:id" element={<PaperDetails />} />
                <Route path="papers/create" element={<CreatePaper />} />
                <Route path="submissions" element={<Submissions />} />
                <Route path="evaluated" element={<EvaluatedSubmissions />} />
              </Route>

              {/* Evaluation Route */}
              <Route element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="/evaluate/:id" element={<Evaluate />} />
              </Route>
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="users" element={<Users />} />
                <Route path="papers" element={<Papers />} />
                <Route path="papers/:id" element={<PaperDetails />} />
                <Route path="results" element={<AdminResults />} />
                <Route path="activities" element={<Activities />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
