import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface TranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}

export const transcribeAudio = async (audioBlob: Blob): Promise<TranscriptionResult> => {
  try {
    // Check if OpenAI API key is configured
    if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.warn('OpenAI API key not configured. Using fallback transcription.');
      return {
        text: "Entschuldigung, die Spracherkennung ist nicht konfiguriert. Bitte tippe deine Nachricht.",
        success: false,
        error: "API key not configured"
      };
    }

    // Convert blob to File object for OpenAI API
    const audioFile = new File([audioBlob], 'audio.webm', { type: audioBlob.type });

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'de', // German language
      response_format: 'text'
    });

    return {
      text: transcription.trim(),
      success: true
    };
  } catch (error) {
    console.error('Whisper API Error:', error);
    
    return {
      text: "Entschuldigung, die Spracherkennung hat nicht funktioniert. Bitte versuche es nochmal oder tippe deine Nachricht.",
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Audio recording utilities
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<{ success: boolean; error?: string }> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      
      return { success: true };
    } catch (error) {
      console.error('Error starting recording:', error);
      
      // Handle specific error types
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            return { 
              success: false, 
              error: 'Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff in deinen Browser-Einstellungen.' 
            };
          case 'NotFoundError':
            return { 
              success: false, 
              error: 'Kein Mikrofon gefunden. Bitte überprüfe deine Geräte-Einstellungen.' 
            };
          case 'NotReadableError':
            return { 
              success: false, 
              error: 'Mikrofon wird bereits verwendet oder ist nicht verfügbar.' 
            };
          case 'OverconstrainedError':
            return { 
              success: false, 
              error: 'Mikrofon unterstützt die angeforderten Einstellungen nicht.' 
            };
          case 'SecurityError':
            return { 
              success: false, 
              error: 'Mikrofon-Zugriff aus Sicherheitsgründen blockiert.' 
            };
          default:
            return { 
              success: false, 
              error: `Mikrofon-Fehler: ${error.message}` 
            };
        }
      }
      
      return { 
        success: false, 
        error: 'Unbekannter Fehler beim Zugriff auf das Mikrofon.' 
      };
    }
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        // Create audio blob from chunks
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Clean up
        this.cleanup();
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

// Check if browser supports audio recording
export const isAudioRecordingSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
};

// Check microphone permission status
export const checkMicrophonePermission = async (): Promise<PermissionState> => {
  try {
    if (!navigator.permissions) {
      return 'prompt'; // Fallback for browsers without Permissions API
    }
    
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return permission.state;
  } catch (error) {
    console.warn('Could not check microphone permission:', error);
    return 'prompt';
  }
};