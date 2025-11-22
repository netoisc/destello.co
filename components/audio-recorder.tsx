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

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
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
        setAudioUrl(url);
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
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
      }
      setIsRecording(false);
      setIsPaused(false);
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
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
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
                  onClick={handleCircleClick}
                  className={`w-32 h-32 rounded-full border-2 flex items-center justify-center backdrop-blur-sm shadow-lg transition-all duration-300 cursor-pointer active:scale-95 ${
                    isPaused
                      ? "bg-purple-500/30 border-purple-400/50 shadow-purple-500/30 hover:scale-105"
                      : "bg-red-500/30 border-red-400/50 shadow-red-500/30 animate-pulse hover:scale-105"
                  }`}
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
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
                  <div className="text-3xl font-bold text-purple-300">{formatTime(recordingTime)}</div>
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

