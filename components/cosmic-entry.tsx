"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface CosmicEntryProps {
  eventName: string;
  onComplete: () => void;
}

export default function CosmicEntry({ eventName, onComplete }: CosmicEntryProps) {
  const [showFlash, setShowFlash] = useState(true);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Flash effect
    const flashTimer = setTimeout(() => {
      setShowFlash(false);
      setShowText(true);
    }, 500);

    // Auto-complete after text appears
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-32 h-32 md:w-64 md:h-64 bg-white rounded-full blur-3xl animate-flash" />
          </motion.div>
        )}
      </AnimatePresence>

      {showText && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-4"
        >
          <motion.p
            className="text-xl md:text-3xl text-white animate-pulse-glow"
            animate={{
              opacity: [0.5, 1, 0.5],
              textShadow: [
                "0 0 10px rgba(255,255,255,0.5)",
                "0 0 20px rgba(255,255,255,1), 0 0 30px rgba(255,255,255,0.8)",
                "0 0 10px rgba(255,255,255,0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Hola, alguien te invitó a:
          </motion.p>
          <motion.p
            className="text-2xl md:text-4xl font-bold text-white mt-4 animate-pulse-glow"
            animate={{
              opacity: [0.5, 1, 0.5],
              textShadow: [
                "0 0 10px rgba(255,255,255,0.5)",
                "0 0 20px rgba(255,255,255,1), 0 0 30px rgba(255,255,255,0.8)",
                "0 0 10px rgba(255,255,255,0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          >
            ✦ {eventName} ✦
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}

