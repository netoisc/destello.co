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
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-black/90 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-center gap-6">
                {/* Hours selector */}
                <div className="flex flex-col items-center gap-2">
                  <Label className="text-xs text-gray-400 mb-2">Hora</Label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
                    {Array.from({ length: 24 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleHourChange(i)}
                        className={`w-12 h-10 rounded-lg text-sm font-medium transition-all ${
                          hours === i
                            ? 'bg-purple-500 text-white scale-110'
                            : 'text-gray-300 hover:bg-purple-500/20 hover:text-purple-300'
                        }`}
                      >
                        {i.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-2xl font-bold text-purple-400">:</span>

                {/* Minutes selector */}
                <div className="flex flex-col items-center gap-2">
                  <Label className="text-xs text-gray-400 mb-2">Minuto</Label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
                    {Array.from({ length: 60 }, (_, i) => i).filter((m) => m % 5 === 0).map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleMinuteChange(minute)}
                        className={`w-12 h-10 rounded-lg text-sm font-medium transition-all ${
                          minutes === minute
                            ? 'bg-purple-500 text-white scale-110'
                            : 'text-gray-300 hover:bg-purple-500/20 hover:text-purple-300'
                        }`}
                      >
                        {minute.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual input */}
                <div className="flex flex-col items-center gap-2 ml-4 pl-4 border-l border-white/10">
                  <Label className="text-xs text-gray-400 mb-2">Formato</Label>
                  <Input
                    type="time"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-32 bg-black/40 border-purple-500/30 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPicker(false)}
                    className="w-full mt-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-all"
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

