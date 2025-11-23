"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "success", isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto md:max-w-md z-50 pointer-events-none"
        >
          <div
            className={`
              flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md
              w-full md:w-auto
              ${
                type === "success"
                  ? "bg-gradient-to-r from-purple-500/95 to-pink-500/95 border border-purple-400/50"
                  : "bg-red-500/95 border border-red-400/50"
              }
              pointer-events-auto
            `}
          >
            {type === "success" ? (
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            ) : (
              <X className="w-5 h-5 text-white flex-shrink-0" />
            )}
            <span className="text-white font-medium text-sm md:text-base leading-tight">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

