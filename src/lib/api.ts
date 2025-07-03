import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log the request for debugging
    console.log('=== API Request ===', {
      url: config.url,
      method: config.method,
      withCredentials: config.withCredentials
    });

    // Ensure credentials are always included
    config.withCredentials = true;
    
    // Set headers
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return Promise.reject(error);
  }
);

// Add caching configuration at the top after axios import
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache persists for 30 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Only retry failed requests once
      refetchOnMount: true, // Always refetch on mount
    },
  },
});

// Auth APIs
export const login = async (email: string, password: string) => {
  try {
    console.log('=== Login Request Start ===');
    console.log('Login attempt for:', email);
    console.log('Using API URL:', import.meta.env.VITE_API_URL);

    // Make the login request using the configured axios instance
    const response = await api.post('/api/auth/login', { email, password });
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

    // Extract and validate user data
    const userData = response.data.user || response.data;
    const token = response.data.token;

    if (!userData || !userData._id || !userData.role) {
      console.error('Invalid user data in response:', response.data);
      throw new Error('Invalid user data in response');
    }

    if (!token) {
      console.error('No token in response:', response.data);
      throw new Error('No token in response');
    }

    // Set token for future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return { user: userData, token };
  } catch (error) {
    console.error('=== Login Error ===');
    console.error('Error details:', error);
    throw error;
  }
};

// These are aliases that use the same endpoint but will be validated by role in the frontend
export const adminLogin = login;
export const facultyLogin = login;

export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local data even if logout fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getMe = () => 
  api.get('/api/auth/me').then(res => res.data);

// User APIs
export const getUsers = () => 
  api.get('/api/users').then(res => res.data);

export const getFacultyUsers = async () => {
  const response = await api.get('/api/users?role=faculty');
  return response.data;
};

export const createUser = (data: any) => 
  api.post('/api/users', data).then(res => res.data);

export const bulkCreateUsers = async (fileOrUsers: File | any[]) => {
  if (fileOrUsers instanceof File) {
    const formData = new FormData();
    const renamedFile = new File([fileOrUsers], 'users.json', {
      type: 'application/json',
    });
    formData.append('file', renamedFile);
    
    try {
      const response = await api.post('/api/users/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to import users');
      }
      throw error;
    }
  } else {
    const response = await api.post('/api/users/bulk', { users: fileOrUsers });
    return response.data;
  }
};

export const updateUser = (id: string, data: any) => 
  api.put(`/api/users/${id}`, data).then(res => res.data);

export const deleteUser = (id: string) => 
  api.delete(`/api/users/${id}`).then(res => res.data);

export const bulkDeleteUsers = async (userIds: string[]) => {
  const response = await api.delete('/api/users/bulk', { data: { userIds } });
  return response.data;
};

// Subject APIs
export const getSubjects = () => 
  api.get('/api/subjects').then(res => res.data);

export const createSubject = (data: any) => 
  api.post('/api/subjects', data).then(res => res.data);

export const updateSubject = (id: string, data: any) => 
  api.put(`/api/subjects/${id}`, data).then(res => res.data);

export const deleteSubject = (id: string) => 
  api.delete(`/api/subjects/${id}`).then(res => res.data);

// Exam Papers
export const getPapers = () => 
  api.get('/api/exam-papers').then(res => res.data);

export const getExamPapers = () => 
  api.get('/api/exam-papers').then(res => res.data);

export const getPaper = (id: string) => 
  api.get(`/api/exam-papers/${id}`).then(res => res.data);

export const getExamPaper = async (id: string) => {
  const response = await api.get(`/api/exam-papers/${id}`);
  return response.data;
};

export const createPaper = (data: any) => 
  api.post('/api/exam-papers', data).then(res => res.data);

export const createExamPaper = createPaper;

export const updatePaper = (id: string, data: any) => 
  api.put(`/api/exam-papers/${id}`, data).then(res => res.data);

export const deletePaper = (id: string) => 
  api.delete(`/api/exam-papers/${id}`).then(res => res.data);

export const approveExamPaper = (id: string) => 
  api.post(`/api/exam-papers/${id}/approve`).then(res => res.data);

export const rejectExamPaper = (id: string, reason: string) => 
  api.post(`/api/exam-papers/${id}/reject`, { reason }).then(res => res.data);

// Submission APIs
export const getSubmissions = () => 
  api.get('/api/submissions').then(res => res.data);

export const getSubmission = (id: string) => 
  api.get(`/api/submissions/${id}`).then(res => res.data);

export const createSubmission = (data: any) => 
  api.post('/api/submissions', data).then(res => res.data);

export const submitExam = createSubmission;

export const updateSubmission = (id: string, data: any) => 
  api.put(`/api/submissions/${id}`, data).then(res => res.data);

export const evaluateSubmission = (id: string, data: any) => 
  api.put(`/api/submissions/${id}/evaluate`, data).then(res => res.data);

export const submitToAdmin = (id: string) => 
  api.put(`/api/submissions/${id}/submit-to-admin`).then(res => res.data);

export const publishResult = (id: string) => 
  api.put(`/api/submissions/${id}/publish`).then(res => res.data);

// Result APIs
export const getResults = () => 
  api.get('/api/results').then(res => res.data);

export const getResult = (id: string) => 
  api.get(`/api/results/${id}`).then(res => res.data);

export const getResultStats = async () => {
  const response = await api.get('/api/results/stats');
  return response.data;
};

export const updateResult = async (id: string, data: any) => {
  const response = await api.patch(`/api/results/${id}`, data);
  return response.data;
};

// Activities
export const getActivities = () => 
  api.get('/api/activities').then(res => res.data);

// Add a function to prefetch common data
export const prefetchDashboardData = async () => {
  const promises = [
    queryClient.prefetchQuery({ queryKey: ['users'], queryFn: getUsers }),
    queryClient.prefetchQuery({ queryKey: ['subjects'], queryFn: getSubjects }),
    queryClient.prefetchQuery({ queryKey: ['examPapers'], queryFn: getExamPapers }),
    queryClient.prefetchQuery({ queryKey: ['submissions'], queryFn: getSubmissions }),
    queryClient.prefetchQuery({ queryKey: ['activities'], queryFn: getActivities }),
  ];
  
  await Promise.allSettled(promises);
};

export default api; 
