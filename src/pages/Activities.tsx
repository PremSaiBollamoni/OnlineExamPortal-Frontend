import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, TrendingUp, Activity as ActivityIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Activities = () => {
  const navigate = useNavigate();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: getActivities
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-600">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">System Activities</h1>
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            All Activities
          </CardTitle>
          <CardDescription className="text-gray-200">
            Complete history of system activities and user actions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center text-gray-500">No activities found</div>
            ) : (
              activities.map((activity: any) => (
                <div key={activity._id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="p-3 rounded-full bg-blue-50">
                    {activity.type === 'user' ? (
                      <User className="h-5 w-5 text-blue-600" />
                    ) : activity.type === 'paper' ? (
                      <FileText className="h-5 w-5 text-blue-600" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-base text-gray-900">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-gray-700">
                        {activity.user?.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="mt-2 text-sm text-gray-600">{activity.details}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Activities; 