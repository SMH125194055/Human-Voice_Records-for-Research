import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mic, List, Clock, User } from 'lucide-react';
import axios from 'axios';

interface RecordingStats {
  total: number;
  recent: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RecordingStats>({ total: 0, recent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = (await user?.getIdToken()) || '';
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/recordings/user/${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const recordings = response.data;
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentRecordings = recordings.filter((recording: any) => 
        new Date(recording.created_at) > oneWeekAgo
      );

      setStats({
        total: recordings.length,
        recent: recentRecordings.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Record New Sample',
      description: 'Create a new voice recording with script',
      icon: Mic,
      href: '/record',
      color: 'bg-primary-500',
    },
    {
      title: 'View Recordings',
      description: 'Browse and manage your recordings',
      icon: List,
      href: '/recordings',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-gray-600">
          Ready to record your next voice sample? Get started with the tools below.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Mic className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Recordings</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats.recent}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <p className="text-2xl font-semibold text-gray-900">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="card hover:shadow-lg transition-shadow duration-200 group"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                    {action.title}
                  </h3>
                  <p className="text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <p className="text-gray-700">
                <strong>Prepare your script:</strong> Write down the text you want to record clearly and practice reading it aloud.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <p className="text-gray-700">
                <strong>Find a quiet space:</strong> Choose a quiet environment with minimal background noise for the best recording quality.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <p className="text-gray-700">
                <strong>Start recording:</strong> Click the "Record New Sample" button above and follow the prompts to create your voice recording.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
