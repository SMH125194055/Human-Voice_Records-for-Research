import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Play, Pause, Trash2, Download, Calendar, Volume2, VolumeX, Volume1 } from 'lucide-react';
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

const MyRecordings: React.FC = () => {
  const { user, supabase } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch recordings only once when component mounts
  useEffect(() => {
    const fetchRecordings = async () => {
      if (!user?.id || loading) return;
      
      setLoading(true);
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
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [user?.id, loading, supabase.auth]); // Include all dependencies

  // Manual time update interval for better reliability
  useEffect(() => {
    if (playingId && audioRef.current) {
      timeUpdateIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }
      }, 100); // Update every 100ms for smooth progress
    } else {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    };
  }, [playingId]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleCanPlay = () => {
      console.log('Audio can play, duration:', audio.duration);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleDurationChange = () => {
      console.log('Duration changed to:', audio.duration);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      console.log('Audio ended');
      setPlayingId(null);
      setCurrentTime(0);
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      toast.error('Error playing audio');
      setPlayingId(null);
      setCurrentTime(0);
      setDuration(0);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Cleanup function
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const handlePlay = async (recording: Recording) => {
    if (playingId === recording.id) {
      // Pause current recording
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      setCurrentTime(0);
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Reset states
      setCurrentTime(0);
      setDuration(0);
      
      // Start playing new recording
      const audioUrl = recording.audio_url.startsWith('http') 
        ? recording.audio_url 
        : `${process.env.REACT_APP_API_URL}${recording.audio_url}`;
      
      console.log('Loading audio URL:', audioUrl);
      
      if (audioRef.current) {
        // Set audio properties for faster loading
        audioRef.current.preload = 'auto';
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current.src = audioUrl;
        
        // Try to play immediately
        try {
          await audioRef.current.play();
          console.log('Audio started playing');
          setPlayingId(recording.id);
        } catch (error) {
          console.error('Error playing audio:', error);
          toast.error('Failed to play recording');
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current && !isNaN(newTime)) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (!isNaN(newVolume)) {
      setVolume(newVolume);
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity || time === undefined) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDelete = async (recordingId: string) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/recordings/${recordingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setRecordings(prev => prev.filter(r => r.id !== recordingId));
      toast.success('Recording deleted successfully');
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
    }
  };

  const handleDownload = (recording: Recording) => {
    const link = document.createElement('a');
    const audioUrl = recording.audio_url.startsWith('http') 
      ? recording.audio_url 
      : `${process.env.REACT_APP_API_URL}${recording.audio_url}`;
    link.href = audioUrl;
    link.download = `${recording.title}.wav`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Recordings</h1>
        <p className="text-sm sm:text-base text-gray-600">
          {recordings.length === 0 
            ? "You haven't created any recordings yet." 
            : `You have ${recordings.length} recording${recordings.length !== 1 ? 's' : ''}.`
          }
        </p>
      </div>

      {recordings.length === 0 ? (
        <div className="card text-center py-8 sm:py-12 px-4">
          <div className="text-gray-400 mb-4">
            <Volume2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No recordings yet</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Start by creating your first voice recording.
          </p>
          <a
            href="/record"
            className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base px-4 py-2"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create First Recording</span>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {recordings.map((recording) => (
            <div key={recording.id} className="card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{recording.title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 self-start sm:self-auto">
                      Active
                    </span>
                  </div>
                  
                  {recording.description && (
                    <p className="text-sm sm:text-base text-gray-600 mb-3">{recording.description}</p>
                  )}
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs sm:text-sm text-gray-700">
                      <strong>Script:</strong> {recording.script_text}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{formatDate(recording.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-start sm:justify-end space-x-2 sm:ml-4">
                  <button
                    onClick={() => handlePlay(recording)}
                    className="p-2 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title={playingId === recording.id ? 'Pause' : 'Play'}
                  >
                    {playingId === recording.id ? (
                      <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDownload(recording)}
                    className="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(recording.id)}
                    className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              {/* Audio Player Bar - Only show for currently playing recording */}
              {playingId === recording.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-col space-y-3">
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500 w-10">{formatTime(currentTime)}</span>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          step="0.1"
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${duration > 0 ? (currentTime / duration) * 100 : 0}%, #e5e7eb ${duration > 0 ? (currentTime / duration) * 100 : 0}%, #e5e7eb 100%)`
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
                    </div>

                    {/* Volume Controls */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={toggleMute}
                        className="text-gray-600 hover:text-primary-600 p-1"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : volume > 0.5 ? (
                          <Volume2 className="h-4 w-4" />
                        ) : (
                          <Volume1 className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex-1 max-w-24">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRecordings;
