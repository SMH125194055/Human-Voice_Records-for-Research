import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

const UserProfile: React.FC = () => {
  const { user, syncUserProfile, supabase } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch profile only once when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          
          if (response.ok) {
            const profileData = await response.json();
            setProfile(profileData);
          } else if (response.status === 404) {
            // Profile doesn't exist yet, that's okay
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id]); // Only depend on user ID

  const handleSyncProfile = async () => {
    setSyncing(true);
    try {
      await syncUserProfile();
      // Refresh profile data after sync
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (response.ok) {
          const profileData = await response.json();
          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Failed to sync profile:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
          <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          User Profile
        </h2>
        <button
          onClick={handleSyncProfile}
          disabled={syncing}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base self-start sm:self-auto"
        >
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Profile'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-sm sm:text-base text-gray-900 break-all">{user.email}</p>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <p className="text-xs sm:text-sm text-gray-900 font-mono break-all">{user.id}</p>
          </div>
        </div>

        {profile && (
          <>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <p className="text-sm sm:text-base text-gray-900">{profile.full_name || 'Not set'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Profile Created
                </label>
                <p className="text-xs sm:text-sm text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <p className="text-xs sm:text-sm text-gray-900">
                  {new Date(profile.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </>
        )}

        {!profile && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-yellow-800">
              User profile not found in database. Click "Sync Profile" to create it.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-xs sm:text-sm text-gray-600">Loading profile...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
