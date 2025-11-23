"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export default function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [hours, setHours] = useState(parseInt(value.split(':')[0]) || 12);
  const [minutes, setMinutes] = useState(parseInt(value.split(':')[1]) || 0);

  const updateTime = (h: number, m: number) => {
    const formattedHours = h.toString().padStart(2, '0');
    const formattedMinutes = m.toString().padStart(2, '0');
    const timeString = `${formattedHours}:${formattedMinutes}`;
    onChange(timeString);
    setHours(h);
    setMinutes(m);
  };

  const handleHourChange = (hour: number) => {
    if (hour >= 0 && hour < 24) {
      updateTime(hour, minutes);
    }
  };

  const handleMinuteChange = (minute: number) => {
    if (minute >= 0 && minute < 60) {
      updateTime(hours, minute);
    }
  };

  // Format hours for 12-hour display
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours < 12 ? 'AM' : 'PM';

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-full h-14 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md px-4 py-3 text-sm text-white flex items-center justify-between hover:border-purple-400/50 focus:border-purple-400/50 focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-purple-400" />
            <span className="text-lg font-medium">
              {value || "Selecciona hora"}
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setShowPicker(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-auto md:top-full md:left-0 md:right-0 md:mt-2 z-50 bg-gradient-to-b from-purple-950/95 to-black/95 backdrop-blur-xl border-t md:border border-purple-500/30 rounded-t-3xl md:rounded-2xl p-6 md:p-6 shadow-2xl max-h-[70vh] md:max-h-none">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                {/* Hours selector */}
                <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                  <Label className="text-xs text-gray-400 mb-2">Hora</Label>
                  <div className="flex flex-col gap-1.5 max-h-[200px] md:max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent px-2">
                    {Array.from({ length: 24 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleHourChange(i)}
                        className={`w-14 md:w-12 h-12 md:h-10 rounded-lg text-base md:text-sm font-medium transition-all touch-manipulation ${
                          hours === i
                            ? 'bg-purple-500 text-white scale-110'
                            : 'text-gray-300 hover:bg-purple-500/20 hover:text-purple-300 active:bg-purple-500/30'
                        }`}
                      >
                        {i.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-3xl md:text-2xl font-bold text-purple-400 hidden md:block">:</span>

                {/* Minutes selector */}
                <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                  <Label className="text-xs text-gray-400 mb-2">Minuto</Label>
                  <div className="flex flex-col gap-1.5 max-h-[200px] md:max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent px-2">
                    {Array.from({ length: 60 }, (_, i) => i).filter((m) => m % 5 === 0).map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleMinuteChange(minute)}
                        className={`w-14 md:w-12 h-12 md:h-10 rounded-lg text-base md:text-sm font-medium transition-all touch-manipulation ${
                          minutes === minute
                            ? 'bg-purple-500 text-white scale-110'
                            : 'text-gray-300 hover:bg-purple-500/20 hover:text-purple-300 active:bg-purple-500/30'
                        }`}
                      >
                        {minute.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format display and button */}
                <div className="flex flex-col md:flex-row items-center gap-3 md:gap-2 w-full md:w-auto md:ml-4 md:pl-4 md:border-l md:border-white/10 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                  <div className="flex flex-col items-center gap-1">
                    <Label className="text-xs text-gray-400">Formato</Label>
                    <span className="text-lg md:text-base font-medium text-purple-300">
                      {displayHour}:{minutes.toString().padStart(2, '0')} {ampm}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPicker(false)}
                    className="w-full md:w-auto px-6 py-3 md:px-4 md:py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl md:rounded-lg text-base md:text-sm font-medium transition-all touch-manipulation"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

