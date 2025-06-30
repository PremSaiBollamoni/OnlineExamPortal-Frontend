import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginUser } from './api';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  semester?: number;
  department?: string;
  school?: string;
  specialization?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  logout: () => void;
  isLoading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (!storedToken || !storedUser) {
          // Clear any partial data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
          return;
        }

        // Validate stored user data
        const userData = JSON.parse(storedUser);
        if (!userData._id || !userData.role) {
          // Invalid user data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
          return;
        }

        setUser(userData);
        setToken(storedToken);

        // Set axios defaults
        axios.defaults.withCredentials = true;
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Update axios token when it changes
  useEffect(() => {
    if (token) {
      // Set token in axios defaults
      axios.defaults.withCredentials = true;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      // Remove token from axios defaults
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Add axios interceptor for token expiry
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && token) {
          // Token expired, logout user
          logout();
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      // Ensure credentials are included for login request
      const response = await loginUser(email, password);
      const { user: userData, token: newToken } = response;
      
      // Validate received data before storing
      if (!userData._id || !userData.role || !newToken) {
        throw new Error('Invalid login response');
      }

      setUser(userData);
      setToken(newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', newToken);

      // Set axios defaults
      axios.defaults.withCredentials = true;
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return response;
    } catch (error) {
      // Clear any partial data on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear all exam-related localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('exam_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Get current path
    const currentPath = window.location.pathname;
    
    // Determine appropriate login page
    let loginPath = '/login';
    if (currentPath.includes('/admin')) {
      loginPath = '/admin/login';
    } else if (currentPath.includes('/faculty')) {
      loginPath = '/faculty/login';
    }
    
    // Navigate to appropriate login page
    window.location.href = loginPath;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 
