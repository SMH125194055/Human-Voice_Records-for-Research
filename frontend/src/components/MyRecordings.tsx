import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Play, Pause, Trash2, Download, Calendar, Clock } from 'lucide-react';
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
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
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

      setRecordings(response.data);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast.error('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (recordingId: string) => {
    const audio = audioRefs[recordingId];
    if (audio) {
      if (playingId === recordingId) {
        audio.pause();
        setPlayingId(null);
      } else {
        // Stop any currently playing audio
        Object.values(audioRefs).forEach(audio => audio.pause());
        audio.play();
        setPlayingId(recordingId);
      }
    }
  };

  const handleAudioEnded = () => {
    setPlayingId(null);
  };

  const handleDelete = async (recordingId: string) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      const token = (await user?.getIdToken()) || '';
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/recordings/${recordingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setRecordings(recordings.filter(r => r.id !== recordingId));
      toast.success('Recording deleted successfully');
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
    }
  };

  const handleDownload = (recording: Recording) => {
    const link = document.createElement('a');
    link.href = `${process.env.REACT_APP_API_URL}${recording.audio_url}`;
    link.download = `${recording.title}.wav`;
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Recordings</h1>
        <p className="text-gray-600">
          {recordings.length === 0 
            ? "You haven't created any recordings yet." 
            : `You have ${recordings.length} recording${recordings.length !== 1 ? 's' : ''}.`
          }
        </p>
      </div>

      {recordings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings yet</h3>
          <p className="text-gray-600 mb-4">
            Start by creating your first voice recording.
          </p>
          <a
            href="/record"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create First Recording</span>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {recordings.map((recording) => (
            <div key={recording.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{recording.title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  
                  {recording.description && (
                    <p className="text-gray-600 mb-3">{recording.description}</p>
                  )}
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Script:</strong> {recording.script_text}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(recording.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handlePlay(recording.id)}
                    className="p-2 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title={playingId === recording.id ? 'Pause' : 'Play'}
                  >
                    {playingId === recording.id ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDownload(recording)}
                    className="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Download"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(recording.id)}
                    className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Hidden audio element */}
              <audio
                ref={(el) => {
                  if (el) {
                    setAudioRefs(prev => ({ ...prev, [recording.id]: el }));
                  }
                }}
                src={`${process.env.REACT_APP_API_URL}${recording.audio_url}`}
                onEnded={handleAudioEnded}
                className="hidden"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRecordings;
