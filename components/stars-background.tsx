"use client";

import { useEffect, useRef } from "react";

export default function StarsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing stars
    container.innerHTML = "";

    // Generate stars based on viewport size
    const starCount = Math.floor((window.innerWidth * window.innerHeight) / 15000);
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.className = Math.random() > 0.9 ? "star bright" : "star";
      
      // Random position
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      star.style.left = `${x}%`;
      star.style.top = `${y}%`;
      
      // Random animation delay for twinkling
      const delay = Math.random() * 3;
      star.style.setProperty("--delay", `${delay}s`);
      
      // Random drift for movement
      const driftX = (Math.random() - 0.5) * 40;
      const driftY = (Math.random() - 0.5) * 40;
      star.style.setProperty("--drift-x", `${driftX}px`);
      star.style.setProperty("--drift-y", `${driftY}px`);
      
      const driftDelay = Math.random() * 10;
      star.style.setProperty("--drift-delay", `${driftDelay}s`);
      
      container.appendChild(star);
    }

    // Handle resize
    const handleResize = () => {
      container.innerHTML = "";
      const newStarCount = Math.floor((window.innerWidth * window.innerHeight) / 15000);
      
      for (let i = 0; i < newStarCount; i++) {
        const star = document.createElement("div");
        star.className = Math.random() > 0.9 ? "star bright" : "star";
        
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        
        const delay = Math.random() * 3;
        star.style.setProperty("--delay", `${delay}s`);
        
        const driftX = (Math.random() - 0.5) * 40;
        const driftY = (Math.random() - 0.5) * 40;
        star.style.setProperty("--drift-x", `${driftX}px`);
        star.style.setProperty("--drift-y", `${driftY}px`);
        
        const driftDelay = Math.random() * 10;
        star.style.setProperty("--drift-delay", `${driftDelay}s`);
        
        container.appendChild(star);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <div ref={containerRef} className="stars-container" />;
}

