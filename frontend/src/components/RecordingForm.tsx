import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Mic, MicOff, Play, Pause, Square, Upload, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface RecordingFormData {
  title: string;
  description: string;
  script_text: string;
}

const RecordingForm: React.FC = () => {
  const { user, supabase } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordingFormData>();

  // Request microphone permission on component mount
  useEffect(() => {
    requestMicrophonePermission();
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
      toast.error('Microphone permission is required to record audio');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast.success('Recording stopped');
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data: RecordingFormData) => {
    if (!audioBlob) {
      toast.error('Please record audio before submitting');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('script_text', data.script_text);
      formData.append('audio_file', audioBlob, 'recording.wav');

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/recordings/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success('Recording uploaded successfully!');
      reset();
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      
      // Clean up audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload recording');
    } finally {
      setIsUploading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Record Voice Sample</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Recording Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="input-field"
                placeholder="Enter recording title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                {...register('description')}
                type="text"
                className="input-field"
                placeholder="Optional description"
              />
            </div>
          </div>

          <div>
            <label htmlFor="script_text" className="block text-sm font-medium text-gray-700 mb-2">
              Script Text *
            </label>
            <textarea
              {...register('script_text', { required: 'Script text is required' })}
              rows={4}
              className="input-field"
              placeholder="Enter the text you want to record..."
            />
            {errors.script_text && (
              <p className="mt-1 text-sm text-red-600">{errors.script_text.message}</p>
            )}
          </div>

          {/* Recording Section */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Voice Recording</h2>
            
            {!hasPermission && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800">
                  Microphone permission is required. Please allow microphone access to record audio.
                </p>
                <button
                  type="button"
                  onClick={requestMicrophonePermission}
                  className="btn-primary mt-2"
                >
                  Grant Permission
                </button>
              </div>
            )}

            {/* Recording Controls */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              {!isRecording && !audioBlob && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!hasPermission}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Mic className="h-5 w-5" />
                  <span>Start Recording</span>
                </button>
              )}

              {isRecording && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2"
                >
                  <Square className="h-5 w-5" />
                  <span>Stop Recording ({formatTime(recordingTime)})</span>
                </button>
              )}

              {audioBlob && !isRecording && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={isPlaying ? pauseRecording : playRecording}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setAudioBlob(null);
                      setAudioUrl(null);
                      setRecordingTime(0);
                      if (audioUrl) {
                        URL.revokeObjectURL(audioUrl);
                        setAudioUrl(null);
                      }
                    }}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <MicOff className="h-5 w-5" />
                    <span>Clear</span>
                  </button>
                </div>
              )}
            </div>

            {/* Audio Player */}
            {audioUrl && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Volume2 className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Audio Preview</span>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full"
                  controls
                />
              </div>
            )}

            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <div className="animate-pulse-slow">
                  <Mic className="h-5 w-5" />
                </div>
                <span className="font-medium">Recording in progress...</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!audioBlob || isUploading}
              className="btn-primary flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Submit Recording</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordingForm;
