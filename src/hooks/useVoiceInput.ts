import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseVoiceInputOptions {
  onTranscript?: (transcript: string) => void;
  continuous?: boolean;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { onTranscript, continuous = false } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  
  // Check browser support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      // Call callback with final transcript
      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      } else if (event.error === 'no-speech') {
        toast({
          title: "No speech detected",
          description: "Try speaking a bit louder or closer to your microphone.",
        });
      } else if (event.error !== 'aborted') {
        toast({
          title: "Voice input error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, continuous, onTranscript]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    setTranscript('');
    try {
      recognitionRef.current?.start();
    } catch (error) {
      // Already started
      console.log('Recognition already started');
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening,
  };
}
