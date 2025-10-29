import { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Clock, User, FileText, Truck, DollarSign, AlertCircle } from 'lucide-react';
import { getRecentActivities, Activity } from '../../services/activityService';

interface RecentActivitiesProps {
  activities?: Activity[];
  className?: string;
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'lead':
      return <User className="h-4 w-4" />;
    case 'deal':
      return <DollarSign className="h-4 w-4" />;
    case 'job':
      return <FileText className="h-4 w-4" />;
    case 'equipment':
      return <Truck className="h-4 w-4" />;
    case 'user':
      return <User className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status?: Activity['status']) => {
  switch (status) {
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50';
    case 'error':
      return 'text-red-600 bg-red-50';
    case 'info':
    default:
      return 'text-blue-600 bg-blue-50';
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Mock data for demonstration
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New lead created',
    description: 'John Doe submitted a crane rental inquiry',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    status: 'info',
    user: 'System',
  },
  {
    id: '2',
    type: 'deal',
    title: 'Deal closed',
    description: 'Construction project deal worth ₹2,50,000 closed successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'success',
    user: 'Sales Agent',
  },
  {
    id: '3',
    type: 'job',
    title: 'Job scheduled',
    description: 'Crane deployment for Site A scheduled for tomorrow',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    status: 'info',
    user: 'Operations Manager',
  },
  {
    id: '4',
    type: 'equipment',
    title: 'Maintenance alert',
    description: 'Crane CR-001 requires scheduled maintenance',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    status: 'warning',
    user: 'System',
  },
  {
    id: '5',
    type: 'user',
    title: 'New user registered',
    description: 'New operator account created for Mike Johnson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    status: 'info',
    user: 'Admin',
  },
];

export function RecentActivities({ activities, className }: RecentActivitiesProps) {
  const [localActivities, setLocalActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        if (activities) {
          setLocalActivities(activities);
        } else {
          const fetchedActivities = await getRecentActivities(5);
          setLocalActivities(fetchedActivities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setLocalActivities(mockActivities);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [activities]);

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Loading activities...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        <Clock className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {localActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No recent activities</p>
          </div>
        ) : (
          localActivities.map(activity => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`flex-shrink-0 p-2 rounded-full ${getStatusColor(activity.status)}`}>
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>

                {activity.user && (
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {activity.user}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {localActivities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all activities →
          </button>
        </div>
      )}
    </Card>
  );
}
