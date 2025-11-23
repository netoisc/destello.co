"use client";

import { useState, useEffect } from "react";
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
  
  // Parse current value
  const currentHours = parseInt(value.split(':')[0]) || 12;
  const currentMinutes = parseInt(value.split(':')[1]) || 0;
  
  // Convert to 12-hour format for display
  const displayHour = currentHours === 0 ? 12 : currentHours > 12 ? currentHours - 12 : currentHours;
  const ampm = currentHours < 12 ? 'AM' : 'PM';
  const displayMinutes = currentMinutes === 30 ? '30' : '00';

  const updateTime = (hour12: number, isPM: boolean, minutes: number) => {
    // Convert 12-hour to 24-hour format
    let hour24 = hour12;
    if (isPM && hour12 !== 12) {
      hour24 = hour12 + 12;
    } else if (!isPM && hour12 === 12) {
      hour24 = 0;
    }
    
    const formattedHours = hour24.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const timeString = `${formattedHours}:${formattedMinutes}`;
    onChange(timeString);
  };

  const handleHourChange = (hour12: number) => {
    const isPM = ampm === 'PM';
    updateTime(hour12, isPM, currentMinutes);
  };

  const handleMinuteChange = (minutes: number) => {
    const isPM = ampm === 'PM';
    updateTime(displayHour, isPM, minutes);
  };

  const toggleAMPM = () => {
    const newIsPM = ampm === 'AM';
    updateTime(displayHour, newIsPM, currentMinutes);
  };

  // Format display value
  const displayValue = `${displayHour}:${displayMinutes} ${ampm}`;

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
              {displayValue || "Selecciona hora"}
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPicker && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPicker(false)}
            />
            {/* Mobile: Bottom Sheet | Desktop: Centered Modal */}
            <div className="fixed bottom-0 left-0 right-0 md:fixed md:inset-0 md:flex md:items-center md:justify-center z-50">
              <div 
                className="w-full md:w-auto md:max-w-md bg-black/95 backdrop-blur-xl border-t md:border border-white/10 rounded-t-2xl md:rounded-2xl shadow-2xl md:shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Bottom Sheet */}
                <div className="md:hidden p-6 space-y-6">
                  {/* Drag handle */}
                  <div className="flex justify-center pt-2 pb-4">
                    <div className="w-12 h-1 bg-white/20 rounded-full" />
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    {/* Hours grid */}
                    <div className="flex-1">
                      <Label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Hora</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }, (_, i) => {
                          const hour12 = i + 1;
                          const isSelected = displayHour === hour12;
                          return (
                            <button
                              key={hour12}
                              type="button"
                              onClick={() => handleHourChange(hour12)}
                              className={`h-12 rounded-lg text-sm font-semibold transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                  : 'bg-white/5 text-gray-300 hover:bg-purple-500/20'
                              }`}
                            >
                              {hour12}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Minutes + AM/PM */}
                    <div className="flex flex-col gap-4">
                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Min</Label>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleMinuteChange(0)}
                            className={`w-16 h-10 rounded-lg text-sm font-semibold transition-all ${
                              currentMinutes === 0
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white/5 text-gray-300 hover:bg-purple-500/20'
                            }`}
                          >
                            00
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMinuteChange(30)}
                            className={`w-16 h-10 rounded-lg text-sm font-semibold transition-all ${
                              currentMinutes === 30
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white/5 text-gray-300 hover:bg-purple-500/20'
                            }`}
                          >
                            30
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Formato</Label>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => toggleAMPM()}
                            className={`w-16 h-10 rounded-lg text-sm font-semibold transition-all ${
                              ampm === 'AM'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white/5 text-gray-300 hover:bg-purple-500/20'
                            }`}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAMPM()}
                            className={`w-16 h-10 rounded-lg text-sm font-semibold transition-all ${
                              ampm === 'PM'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white/5 text-gray-300 hover:bg-purple-500/20'
                            }`}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPicker(false)}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Aceptar
                  </button>
                </div>

                {/* Desktop Modal */}
                <div className="hidden md:block p-6">
                  <div className="flex items-start gap-6">
                    {/* Hours */}
                    <div className="flex-1">
                      <Label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Hora</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }, (_, i) => {
                          const hour12 = i + 1;
                          const isSelected = displayHour === hour12;
                          return (
                            <button
                              key={hour12}
                              type="button"
                              onClick={() => handleHourChange(hour12)}
                              className={`h-10 rounded-lg text-sm font-semibold transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                  : 'bg-white/5 text-gray-300 hover:bg-purple-500/20'
                              }`}
                            >
                              {hour12}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Minutes + AM/PM */}
                    <div className="flex gap-4">
                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Min</Label>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleMinuteChange(0)}
                            className={`w-14 h-10 rounded-lg text-sm font-semibold transition-all ${
                              currentMinutes === 0
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white/5 text-gray-300 hover:bg-purple-500/20'
                            }`}
                          >
                            00
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMinuteChange(30)}
                            className={`w-14 h-10 rounded-lg text-sm font-semibold transition-all ${
                              currentMinutes === 30
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white/5 text-gray-300 hover:bg-purple-500/20'
                            }`}
                          >
                            30
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Formato</Label>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => toggleAMPM()}
                            className={`w-14 h-10 rounded-lg text-sm font-semibold transition-all ${
                              ampm === 'AM'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white/5 text-gray-300 hover:bg-purple-500/20'
                            }`}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAMPM()}
                            className={`w-14 h-10 rounded-lg text-sm font-semibold transition-all ${
                              ampm === 'PM'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white/5 text-gray-300 hover:bg-purple-500/20'
                            }`}
                          >
                            PM
                          </button>
                        </div>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => setShowPicker(false)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

