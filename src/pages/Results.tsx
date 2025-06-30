import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSubmissions } from '@/lib/api';
import { useAuthContext } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, Eye, TrendingUp, Award, Target } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

const Results = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['submissions', user?._id],
    queryFn: getSubmissions,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load results. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filter submissions for published results only
  const publishedResults = submissions
    .filter((sub: any) => 
      sub.student._id === user?._id && 
      sub.status === 'published' &&
      sub.score !== null
    )
    .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Calculate overall statistics
  const totalPublished = publishedResults.length;
  const averageScore = totalPublished > 0
    ? Math.round(publishedResults.reduce((acc: number, sub: any) => acc + (sub.score / sub.examPaper.totalMarks * 100), 0) / totalPublished)
    : 0;
  const passedCount = publishedResults.filter((sub: any) => (sub.score / sub.examPaper.totalMarks * 100) >= 40).length;
  const highestScore = totalPublished > 0
    ? Math.max(...publishedResults.map((sub: any) => Math.round(sub.score / sub.examPaper.totalMarks * 100)))
    : 0;

  // Group results by subject
  const subjectResults = publishedResults.reduce((acc: any, result: any) => {
    const subjectName = result.examPaper.subject.name;
    if (!acc[subjectName]) {
      acc[subjectName] = {
        count: 0,
        totalScore: 0,
        passed: 0
      };
    }
    acc[subjectName].count++;
    acc[subjectName].totalScore += (result.score / result.examPaper.totalMarks * 100);
    if ((result.score / result.examPaper.totalMarks * 100) >= 40) acc[subjectName].passed++;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Academic Performance</h1>
        <p className="text-gray-600 mt-2">Comprehensive view of your evaluated exam results</p>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800">Overall Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{averageScore}%</div>
            <Progress value={averageScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {totalPublished > 0 ? Math.round((passedCount / totalPublished) * 100) : 0}%
            </div>
            <p className="text-sm text-green-600 mt-1">{passedCount} out of {totalPublished} exams</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-800">Highest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{highestScore}%</div>
            <p className="text-sm text-purple-600 mt-1">Personal best</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-800">Total Evaluated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{totalPublished}</div>
            <p className="text-sm text-yellow-600 mt-1">Published results</p>
          </CardContent>
        </Card>
      </div>

      {publishedResults.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">No published results available yet.</p>
            <p className="text-gray-500 text-sm text-center mt-2">
              Your results will appear here after evaluation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Subject-wise Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Subject-wise Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(subjectResults).map(([subject, data]: [string, any]) => (
                  <div key={subject} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">{subject}</h4>
                      <Badge variant={data.passed === data.count ? "secondary" : "outline"}>
                        {Math.round((data.totalScore / data.count))}% avg
                      </Badge>
                    </div>
                    <Progress value={(data.passed / data.count) * 100} />
                    <p className="text-sm text-gray-500">
                      Passed {data.passed} out of {data.count} exams
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {publishedResults.map((result: any) => (
                  <div 
                    key={result._id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{result.examPaper.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{result.examPaper.subject.name}</Badge>
                        <span className="text-sm text-gray-500">
                          Marks: {result.score} / {result.examPaper.totalMarks}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${(result.score / result.examPaper.totalMarks * 100) >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.round(result.score / result.examPaper.totalMarks * 100)}%
                        </div>
                        <Badge variant={(result.score / result.examPaper.totalMarks * 100) >= 40 ? 'secondary' : 'destructive'}>
                          {(result.score / result.examPaper.totalMarks * 100) >= 40 ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/submissions/${result._id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Results;
