import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mic, List, Clock, User } from 'lucide-react';
import UserProfile from './UserProfile';
import UserProfileForm from './UserProfileForm';

interface RecordingStats {
  total: number;
  recent: number;
}

const Dashboard: React.FC = () => {
  const { user, supabase } = useAuth();
  const [stats, setStats] = useState<RecordingStats>({ total: 0, recent: 0 });
  const [loading, setLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Fetch data only once when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || loading) return;
      
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        
        // Fetch recordings for stats
        const recordingsResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/recordings/user/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (recordingsResponse.ok) {
          const recordings = await recordingsResponse.json();
          const now = new Date();
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          const recentRecordings = recordings.filter((recording: any) => 
            new Date(recording.created_at) > oneWeekAgo
          );

          setStats({
            total: recordings.length,
            recent: recentRecordings.length,
          });
        }

        // Fetch user profile
        const profileResponse = await fetch(`${process.env.REACT_APP_API_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          const isComplete = Boolean(profile && profile.full_name && profile.full_name.trim() !== '');
          setProfileComplete(isComplete);
          setShowProfileForm(!isComplete);
        } else {
          setProfileComplete(false);
          setShowProfileForm(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setProfileComplete(false);
        setShowProfileForm(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, loading, supabase.auth]); // Include all dependencies

  const handleProfileComplete = () => {
    setProfileComplete(true);
    setShowProfileForm(false);
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

  // Show profile form if profile is not complete
  if (showProfileForm) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Please complete your profile to continue.
          </p>
        </div>
        <UserProfileForm onComplete={handleProfileComplete} isRequired={true} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Ready to record your next voice sample? Get started with the tools below.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total Recordings</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">This Week</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats.recent}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Account Status</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="card hover:shadow-lg transition-shadow cursor-pointer p-4 sm:p-6"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-2 sm:p-3 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">{action.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Profile Information</h2>
          <button
            onClick={() => setShowProfileForm(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium self-start sm:self-auto"
          >
            Edit Profile
          </button>
        </div>
        <UserProfile />
      </div>
    </div>
  );
};

export default Dashboard;
