import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfileFormProps {
  onComplete: () => void;
  isRequired?: boolean;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ onComplete, isRequired = false }) => {
  const { user, supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  // Initialize form data only once when component mounts
  useEffect(() => {
    if (user) {
      // Get name from user metadata or fallback to empty
      const fullName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      '';
      
      setFormData({
        full_name: fullName,
        email: user.email || ''
      });
      
      // Fetch existing profile data if available
      const fetchProfile = async () => {
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
              setFormData({
                full_name: profileData.full_name || fullName,
                email: profileData.email || user.email || ''
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      };
      
      fetchProfile();
    }
  }, [user?.id]); // Only depend on user ID

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile/update`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          toast.success('Profile updated successfully!');
          onComplete();
        } else {
          throw new Error('Failed to update profile');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-md mx-auto">
      <div className="flex items-center mb-4 sm:mb-6">
        <User className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" />
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          {isRequired ? 'Complete Your Profile' : 'Update Profile'}
        </h2>
      </div>

      {isRequired && (
        <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-blue-800">
              Please complete your profile information to continue using the application.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="full_name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your full name"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default UserProfileForm;
