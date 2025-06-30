import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, GraduationCap, BookOpen, Shield } from 'lucide-react';
import { useAuthContext } from '@/lib/auth-context';
import axios from 'axios';

interface LoginFormProps {
  userType: 'student' | 'faculty' | 'admin';
}

const LoginForm = ({ userType }: LoginFormProps) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthContext();

  // Color schemes based on user type
  const getColorScheme = () => {
    switch (userType) {
      case 'student':
        return {
          gradient: 'from-blue-600 to-blue-500',
          hoverGradient: 'hover:from-blue-700 hover:to-blue-600',
          focusColor: 'focus:border-blue-500 focus:ring-blue-500',
          titleColor: 'text-blue-600',
          borderColor: 'border-blue-600',
          shadowColor: 'shadow-blue-600'
        };
      case 'faculty':
        return {
          gradient: 'from-green-600 to-green-500',
          hoverGradient: 'hover:from-green-700 hover:to-green-600',
          focusColor: 'focus:border-green-500 focus:ring-green-500',
          titleColor: 'text-green-600',
          borderColor: 'border-green-600',
          shadowColor: 'shadow-green-600'
        };
      case 'admin':
        return {
          gradient: 'from-red-800 to-red-700',
          hoverGradient: 'hover:from-red-900 hover:to-red-800',
          focusColor: 'focus:border-red-500 focus:ring-red-500',
          titleColor: 'text-red-800',
          borderColor: 'border-red-800',
          shadowColor: 'shadow-red-800'
        };
    }
  };

  const colorScheme = getColorScheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('=== Login Attempt Start ===');
      console.log('API URL:', import.meta.env.VITE_API_URL);
      console.log('Login credentials:', { ...credentials, password: '[HIDDEN]' });
      
      // Log the request configuration
      const requestConfig = {
        method: 'post',
        url: `${import.meta.env.VITE_API_URL}/api/auth/login`,
        data: credentials,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      console.log('Request configuration:', requestConfig);

      // Make direct API call with credentials
      const response = await axios(requestConfig);

      console.log('Login response:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });

      const { user, token } = response.data;
      
      // Check if user role matches the expected role
      if (user.role !== userType) {
        throw new Error(`Invalid credentials for ${userType} login`);
      }

      // Store the token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('=== Login Success ===');
      console.log('User role:', user.role);
      console.log('Token stored:', token ? 'Yes' : 'No');

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
      });
        
      // Get redirect path from location state or use default
      const from = location.state?.from || '/';
      
      // Route based on user type
      switch(user.role) {
        case 'student':
          navigate('/dashboard');
          break;
        case 'faculty':
          navigate('/faculty');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate(from);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Please enter valid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const getUserTypeTitle = () => {
    switch (userType) {
      case 'student': return 'Student Portal';
      case 'faculty': return 'Faculty Portal';
      case 'admin': return 'Admin Portal';
      default: return 'Login';
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 relative"
      style={{ 
        backgroundImage: 'url(/cutmap.jpg)',
      }}
    >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-white/75"></div>

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={handleBackToHome}
        className={`absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:${colorScheme?.titleColor} hover:bg-gray-50 transition-colors z-10`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Button>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <img 
              src="/favicon.png" 
              alt="Centurion University Logo" 
              className="w-32 h-32 object-contain animate-fadeIn"
            />
          </div>
          <div className="animate-slideUp">
            <h1 className="text-3xl font-bold text-gray-900">Centurion University</h1>
            <p className="text-gray-600 mt-2">Online Examination Portal</p>
          </div>
        </div>

        <Card 
          className={`
            shadow-2xl 
            border 
            ${colorScheme?.borderColor}/20
            bg-white/90 
            backdrop-blur-lg 
            transition-all 
            duration-300 
            animate-fadeIn 
            hover:shadow-[0_0_15px_rgba(0,0,0,0.1)] 
            hover:${colorScheme?.borderColor}/50
            hover:shadow-${colorScheme?.shadowColor}/20
            motion-safe:animate-fadeIn 
            motion-safe:animate-slideUp
          `}
        >
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className={`text-2xl font-bold text-center ${colorScheme?.titleColor}`}>
              {getUserTypeTitle()}
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className={`h-12 border-gray-300 ${colorScheme?.focusColor} transition-colors`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className={`h-12 border-gray-300 ${colorScheme?.focusColor} transition-colors`}
                />
              </div>
              <Button
                type="submit"
                className={`w-full h-12 bg-gradient-to-r ${colorScheme?.gradient} ${colorScheme?.hoverGradient} text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl`}
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500 animate-fadeIn">
          <p>Need help? Contact IT Support at support@centurion.edu</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
