import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Recording {
  id: string;
  title: string;
  description: string;
  script_text: string;
  audio_url: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

interface RecordingStats {
  total: number;
  recent: number;
}

interface DataContextType {
  recordings: Recording[];
  userProfile: UserProfile | null;
  stats: RecordingStats;
  loading: {
    recordings: boolean;
    profile: boolean;
    stats: boolean;
  };
  fetchRecordings: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  fetchStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
  updateRecordings: (recordings: Recording[]) => void;
  updateUserProfile: (profile: UserProfile) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user, supabase } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<RecordingStats>({ total: 0, recent: 0 });
  const [loading, setLoading] = useState({
    recordings: false,
    profile: false,
    stats: false,
  });

  const fetchRecordings = useCallback(async () => {
    if (!user?.id || loading.recordings) return;
    
    setLoading(prev => ({ ...prev, recordings: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/recordings/user/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setRecordings(response.data);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast.error('Failed to load recordings');
    } finally {
      setLoading(prev => ({ ...prev, recordings: false }));
    }
  }, [user?.id, supabase]);

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id || loading.profile) return;
    
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
        } else if (response.status === 404) {
          setUserProfile(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  }, [user?.id, supabase]);

  const fetchStats = useCallback(async () => {
    if (!user?.id || loading.stats) return;
    
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/recordings/user/${user.id}`,
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
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [user?.id, supabase]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchRecordings(),
      fetchUserProfile(),
      fetchStats(),
    ]);
  }, [fetchRecordings, fetchUserProfile, fetchStats]);

  const updateRecordings = useCallback((newRecordings: Recording[]) => {
    setRecordings(newRecordings);
  }, []);

  const updateUserProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
  }, []);

  const value: DataContextType = {
    recordings,
    userProfile,
    stats,
    loading,
    fetchRecordings,
    fetchUserProfile,
    fetchStats,
    refreshAll,
    updateRecordings,
    updateUserProfile,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
