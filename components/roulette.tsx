"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface RouletteProps {
  options: string[];
  onResult: (result: string) => void;
}

export default function Roulette({ options, onResult }: RouletteProps) {
  const [spinning, setSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const spin = () => {
    if (spinning || options.length === 0) return;
    
    setSpinning(true);
    
    // Random spin duration and result
    const duration = 3000 + Math.random() * 2000;
    const finalIndex = Math.floor(Math.random() * options.length);
    
    // Animate through options
    const spinInterval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % options.length);
    }, 100);

    setTimeout(() => {
      clearInterval(spinInterval);
      setSelectedIndex(finalIndex);
      setSpinning(false);
      
      // Start countdown to Big Bang
      setCountdown(10);
    }, duration);
  };

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Big Bang - autodestrucción
      onResult(options[selectedIndex]);
    }
  }, [countdown, selectedIndex, options, onResult]);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 10 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.5, 2],
                opacity: [1, 0.5, 0],
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-6xl md:text-8xl font-bold text-white"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {countdown === null && (
        <div className="w-full max-w-md space-y-8">
          <motion.div
            animate={{ rotate: spinning ? 360 : 0 }}
            transition={{
              duration: spinning ? 5 : 0,
              ease: "easeOut",
            }}
            className="relative w-64 h-64 mx-auto"
          >
            {/* Nebula background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 blur-3xl" />
            
            {/* Options circle */}
            <div className="absolute inset-0 rounded-full border-2 border-white/20 flex items-center justify-center">
              {options.map((option, index) => {
                const angle = (index * 360) / options.length;
                const radius = 100;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: spinning && index === selectedIndex ? 1 : 0.3,
                      scale: spinning && index === selectedIndex ? 1.2 : 1,
                    }}
                    exit={{ opacity: 0, x: x * 2, y: y * 2 }}
                    className="absolute"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  >
                    <div
                      className={`text-white text-sm px-2 py-1 rounded ${
                        index === selectedIndex
                          ? "bg-primary text-black font-bold"
                          : "bg-secondary/50"
                      }`}
                    >
                      {option}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Center indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full" />
            </div>
          </motion.div>

          {!spinning && countdown === null && (
            <div className="text-center">
              <p className="text-white mb-4">
                {options[selectedIndex]}
              </p>
              <Button onClick={spin} size="lg" className="w-full">
                Girar ruleta
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

