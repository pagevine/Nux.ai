import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { AudioRecorder, transcribeAudio, isAudioRecordingSupported, checkMicrophonePermission } from '../services/whisper';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscription, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [showPermissionHint, setShowPermissionHint] = useState(false);
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize recorder
    recorderRef.current = new AudioRecorder();
    
    // Check initial permission state
    checkMicrophonePermission().then(setPermissionState);
    
    return () => {
      // Cleanup on unmount
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    if (!recorderRef.current || disabled) return;

    setError(null);
    setShowPermissionHint(false);
    
    const result = await recorderRef.current.startRecording();
    if (result.success) {
      setIsRecording(true);
      setRecordingTime(0);
      setPermissionState('granted');
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setError(result.error || 'Mikrofon-Zugriff verweigert');
      setPermissionState('denied');
      setShowPermissionHint(true);
      
      // Hide hint after 5 seconds
      setTimeout(() => setShowPermissionHint(false), 5000);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;

    setIsRecording(false);
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsTranscribing(true);

    try {
      const audioBlob = await recorderRef.current.stopRecording();
      
      if (audioBlob && audioBlob.size > 0) {
        // Transcribe audio
        const result = await transcribeAudio(audioBlob);
        
        if (result.success && result.text.trim()) {
          onTranscription(result.text);
        } else {
          setError(result.error || 'Keine Sprache erkannt');
          setTimeout(() => setError(null), 3000);
        }
      } else {
        setError('Keine Aufnahme gefunden');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Recording error:', error);
      setError('Fehler bei der Aufnahme');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsTranscribing(false);
      setRecordingTime(0);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if not supported
  if (!isAudioRecordingSupported()) {
    return null;
  }

  const getButtonStyle = () => {
    if (isTranscribing) {
      return 'bg-blue-100 text-blue-600 cursor-not-allowed';
    }
    if (isRecording) {
      return 'bg-red-500 hover:bg-red-600 text-white animate-pulse';
    }
    if (permissionState === 'denied') {
      return 'bg-gray-100 hover:bg-gray-200 text-gray-600';
    }
    return 'bg-gray-100 hover:bg-gray-200 text-gray-600';
  };

  const getButtonTitle = () => {
    if (isTranscribing) return 'Wird transkribiert...';
    if (isRecording) return 'Aufnahme beenden';
    if (permissionState === 'denied') return 'Mikrofon-Berechtigung erforderlich';
    return 'Spracheingabe starten';
  };

  const getButtonIcon = () => {
    if (isTranscribing) return <Loader2 size={18} className="animate-spin" />;
    if (isRecording) return <MicOff size={18} />;
    return <Mic size={18} />;
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || isTranscribing}
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${getButtonStyle()} disabled:cursor-not-allowed`}
        title={getButtonTitle()}
      >
        {getButtonIcon()}
      </button>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
          🔴 {formatTime(recordingTime)}
        </div>
      )}

      {/* Transcribing indicator */}
      {isTranscribing && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
          🎤 Wird erkannt...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-medium max-w-64 text-center leading-tight z-50">
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle size={12} />
            <span>Fehler</span>
          </div>
          <div className="text-xs opacity-90">{error}</div>
        </div>
      )}

      {/* Permission hint - only show when needed */}
      {showPermissionHint && permissionState === 'denied' && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-medium max-w-64 text-center leading-tight z-50">
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle size={12} />
            <span>Mikrofon-Zugriff erforderlich</span>
          </div>
          <div className="text-xs opacity-90">
            Klicke auf das Mikrofon-Symbol in der Adressleiste und erlaube den Zugriff.
          </div>
        </div>
      )}
    </div>
  );
};