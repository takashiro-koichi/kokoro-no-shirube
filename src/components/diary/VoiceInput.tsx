'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Web Speech API の型定義
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  // onTranscript を最新の値で保持
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch {
      // すでに開始されている場合は無視
    }
  }, []);

  useEffect(() => {
    // ブラウザサポートチェック
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        onTranscriptRef.current(final);
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      // no-speech エラーの場合は自動再開
      if (event.error === 'no-speech' && shouldRestartRef.current) {
        return; // onend で再開される
      }
      shouldRestartRef.current = false;
      setIsRecording(false);
    };

    recognition.onend = () => {
      setInterimText('');
      // 手動停止でなければ自動再開
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch {
          shouldRestartRef.current = false;
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      // 手動停止
      shouldRestartRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // 録音開始
      shouldRestartRef.current = true;
      setIsRecording(true);
      startRecognition();
    }
  };

  if (!isSupported) {
    return (
      <Button variant="outline" disabled>
        音声入力非対応
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isRecording ? 'destructive' : 'outline'}
        onClick={toggleRecording}
        disabled={disabled}
      >
        {isRecording ? (
          <>
            <Square className="w-4 h-4 mr-2" />
            停止
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 mr-2" />
            音声入力
          </>
        )}
      </Button>
      {isRecording && (
        <span className="text-sm text-red-500 animate-pulse">● 録音中</span>
      )}
      {interimText && (
        <span className="text-sm text-muted-foreground italic max-w-xs truncate">
          {interimText}
        </span>
      )}
    </div>
  );
}
