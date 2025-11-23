"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Play, Pause } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  onDelete?: () => void;
  className?: string;
}

export default function AudioRecorder({ 
  onRecordingComplete, 
  onDelete, 
  className 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timeDisplayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, [audioUrl]);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop immediately, we just wanted permission
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err: any) {
      setHasPermission(false);
      if (err.name === "NotAllowedError") {
        setError("Permiso de micrófono denegado. Por favor permite el acceso en la configuración de tu navegador.");
      } else if (err.name === "NotFoundError") {
        setError("No se encontró ningún micrófono.");
      } else {
        setError("Error al acceder al micrófono: " + err.message);
      }
      return false;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);

      if (hasPermission === null || hasPermission === false) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Detectar mejor formato compatible según el navegador
      // Priorizar formatos para máxima compatibilidad:
      // 1. Safari iOS: audio/mp4 o audio/m4a
      // 2. Android Chrome: audio/webm
      // 3. Desktop: audio/webm o audio/mp4
      
      let mimeType = "audio/webm"; // Default para Chrome/Firefox
      
      // Detectar si es iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isIOS || isSafari) {
        // Safari iOS prefiere audio/mp4 o audio/m4a
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/m4a")) {
          mimeType = "audio/m4a";
        } else if (MediaRecorder.isTypeSupported("audio/aac")) {
          mimeType = "audio/aac";
        }
      } else {
        // Chrome, Firefox, Edge - preferir webm
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(audioBlob);
        
        // Cleanup timer before state updates
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setAudioUrl(url);
        setIsRecording(false);
        setIsPaused(false);
        startTimeRef.current = null;
        
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
      };

      // Start recording first
      mediaRecorder.start(100); // Request data every 100ms to avoid buffer issues
      
      // Set state after recorder is started
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Initialize display
      if (timeDisplayRef.current) {
        timeDisplayRef.current.textContent = "0:00";
      }

      // Update time display directly WITHOUT causing re-renders
      const updateTime = () => {
        // Check if still recording
        if (!startTimeRef.current || !mediaRecorderRef.current) {
          return;
        }
        
        const state = mediaRecorderRef.current.state;
        if (state === 'inactive' || state === 'recording' === false) {
          return;
        }
        
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        // Update display directly via DOM to avoid React re-renders
        if (timeDisplayRef.current) {
          const mins = Math.floor(elapsed / 60);
          const secs = elapsed % 60;
          timeDisplayRef.current.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
        }
      };

      // Update every 500ms for smoother performance (less frequent = fewer interruptions)
      timerRef.current = setInterval(updateTime, 500);
    } catch (err: any) {
      setError("Error al iniciar la grabación: " + err.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
      setIsPaused(false);
      startTimeRef.current = null;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePause = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        // Resume timer from where we paused - adjust startTime to account for paused duration
        if (startTimeRef.current) {
          const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const pausedElapsed = recordingTime;
          const pausedDuration = currentElapsed - pausedElapsed;
          startTimeRef.current = Date.now() - (pausedElapsed * 1000);
        } else {
          startTimeRef.current = Date.now();
        }
        
        const updateTime = () => {
          if (!startTimeRef.current || !mediaRecorderRef.current) return;
          
          const state = mediaRecorderRef.current.state;
          if (state === 'inactive' || state === 'paused') return;
          
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          
          if (timeDisplayRef.current) {
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            timeDisplayRef.current.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
          }
        };

        timerRef.current = setInterval(updateTime, 500);
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsPaused(true);
      }
    }
  };

  const handleCircleClick = () => {
    if (isRecording) {
      if (isPaused) {
        togglePause();
      } else {
        stopRecording();
      }
    } else {
      startRecording();
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      if (onDelete) {
        onDelete();
      }
    }
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!audioUrl ? (
        <div className="space-y-4">
          {!isRecording ? (
            <div className="space-y-4">
              {/* Large circular microphone button */}
              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={handleCircleClick}
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400/30 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:border-purple-400/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group"
                >
                  <Mic className="h-12 w-12 text-purple-300 group-hover:text-purple-200 transition-colors" />
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-1">Toca para grabar</p>
                  <p className="text-xs text-gray-500">
                    Opcional: agrega un mensaje de voz personal
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recording indicator with timer */}
              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCircleClick();
                  }}
                  className={`w-32 h-32 rounded-full border-2 flex items-center justify-center backdrop-blur-sm shadow-lg transition-all duration-300 cursor-pointer ${
                    isPaused
                      ? "bg-purple-500/30 border-purple-400/50 shadow-purple-500/30 hover:scale-105"
                      : "bg-red-500/30 border-red-400/50 shadow-red-500/30 hover:scale-105"
                  }`}
                  style={!isPaused ? { 
                    animation: 'recording-pulse 2s ease-in-out infinite'
                  } : undefined}
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
                    isPaused ? "bg-purple-500" : "bg-red-500"
                  }`}>
                    {isPaused ? (
                      <Play className="h-10 w-10 text-white" />
                    ) : (
                      <Square className="h-8 w-8 text-white" />
                    )}
                  </div>
                </button>
                
                <div className="text-center">
                  <div 
                    ref={timeDisplayRef}
                    className="text-3xl font-bold text-purple-300 tabular-nums"
                  >
                    {formatTime(recordingTime)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {isPaused ? "Pausado - Toca para continuar" : "Grabando... - Toca para detener"}
                  </div>
                </div>
              </div>

              {!isPaused && (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-400">Grabando...</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="flex-1 h-10"
            />
          </div>
          <Button
            type="button"
            onClick={deleteRecording}
            variant="outline"
            className="w-full rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar grabación
          </Button>
        </div>
      )}
    </div>
  );
}

