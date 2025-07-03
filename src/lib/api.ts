import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Log the API URL for debugging
console.log('API URL from env:', import.meta.env.VITE_API_URL);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://onlineexamportal-backend.onrender.com',
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
    // Log request for debugging
    console.log('=== API Request Start ===');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Headers:', config.headers);
    console.log('=== API Request End ===');

    // Ensure credentials are always included
    config.withCredentials = true;
    
    // Set headers
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    config.headers.set('Content-Type', 'application/json');
    config.headers.set('Accept', 'application/json');

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful response for debugging
    console.log('=== API Response Success ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('=== API Response End ===');
    return response;
  },
  (error) => {
    console.error('=== API Error Start ===');
    console.error('Error Message:', error.message);
    console.error('Response Data:', error.response?.data);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
    console.error('=== API Error End ===');
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = async (email: string, password: string) => {
  console.log('=== Login Request Start ===');
  console.log('Login credentials:', { email, password: '[HIDDEN]' });
  console.log('Request configuration:', {
    method: 'post',
    url: `${import.meta.env.VITE_API_URL}/api/auth/login`,
    data: { email, password },
    withCredentials: true,
    headers: api.defaults.headers
  });

  const response = await api.post('/api/auth/login', { email, password });
  console.log('Login response data structure:', {
    fullResponse: response,
    dataOnly: response.data,
    hasUser: response.data?.user ? 'yes' : 'no',
    hasToken: response.data?.token ? 'yes' : 'no',
    dataKeys: Object.keys(response.data || {}),
    userObject: response.data?.user,
    tokenValue: response.data?.token
  });

  if (!response.data) {
    console.error('No data in response');
    throw new Error('Invalid login response - no data');
  }

  // Try to handle different response structures
  let userData = response.data.user;
  let token = response.data.token;

  // If the data itself is the user object
  if (response.data._id && response.data.email && !userData) {
    userData = response.data;
    token = response.data.token || response.headers?.authorization?.replace('Bearer ', '');
  }

  if (!userData || !token) {
    console.error('Invalid login response structure:', {
      responseData: response.data,
      extractedUser: userData,
      extractedToken: token
    });
    throw new Error('Invalid login response structure');
  }

  // Set token in axios defaults
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  return { user: userData, token };
};

// These are aliases that use the same endpoint but will be validated by role in the frontend
export const adminLogin = login;
export const facultyLogin = login;

export const logout = async () => {
  try {
    const response = await api.post('/api/auth/logout');
    // Clear auth headers and storage
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  } catch (error) {
    // Clear auth headers even if logout fails
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
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

export const getExamPapers = getPapers;

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

export default api; 
