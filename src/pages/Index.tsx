import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Shield, Users } from 'lucide-react';
import { useAuthContext } from '@/lib/auth-context';

const Index = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'student':
          navigate('/dashboard');
          break;
        case 'faculty':
          navigate('/faculty');
          break;
        case 'admin':
          navigate('/admin');
          break;
      }
    }
  }, [user, navigate]);

  const portals = [
    {
      title: 'Student Portal',
      description: 'Access your exams, view results, and track your academic progress',
      icon: GraduationCap,
      link: '/login',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700'
    },
    {
      title: 'Faculty Portal',
      description: 'Create exams, evaluate submissions, and manage student assessments',
      icon: BookOpen,
      link: '/faculty/login',
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700'
    },
    {
      title: 'Admin Portal',
      description: 'Manage users, oversee examinations, and maintain system operations',
      icon: Shield,
      link: '/admin/login',
      color: 'bg-red-800',
      hoverColor: 'hover:bg-red-900'
    }
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: 'url(/cutmap.jpg)',
      }}
    >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-white/75"></div>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl w-full text-center mb-12">
          <div className="flex justify-center mb-8">
            <img 
              src="/favicon.png" 
              alt="Centurion University Logo" 
              className="w-40 h-40 object-contain"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Online Examination Portal
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            A comprehensive digital platform for conducting secure online examinations, 
            managing assessments, and tracking academic performance.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>Trusted by 1,200+ students and 80+ faculty members</span>
          </div>
        </div>

        <div className="max-w-7xl w-full">
          <div className="grid md:grid-cols-3 gap-8">
            {portals.map((portal, index) => {
              const Icon = portal.icon;
              return (
                <Card 
                  key={index} 
                  className="relative overflow-hidden border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 ${portal.color} rounded-2xl flex items-center justify-center mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">{portal.title}</CardTitle>
                    <CardDescription className="text-gray-600 mt-2">
                      {portal.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      asChild 
                      className={`w-full ${portal.color} ${portal.hoverColor} text-white font-medium py-6 text-lg`}
                    >
                      <Link to={portal.link}>
                        Access Portal
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
