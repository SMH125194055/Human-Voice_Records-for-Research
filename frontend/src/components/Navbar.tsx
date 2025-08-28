import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mic, User, LogOut, Home, List } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Mic className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Voice Recorder</span>
            </Link>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/record"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
              >
                <Mic className="h-4 w-4" />
                <span>Record</span>
              </Link>
              
              <Link
                to="/recordings"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
              >
                <List className="h-4 w-4" />
                <span>My Recordings</span>
              </Link>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
