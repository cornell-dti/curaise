"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";

export function ConfettiEffect() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [pieceCount, setPieceCount] = useState(1000);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Check if user came from checkout by looking at URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isFromCheckout = urlParams.get("fromCheckout") === "true";
    
    if (isFromCheckout) {
      // Update window dimensions
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Clean up URL parameter immediately
      const url = new URL(window.location.href);
      url.searchParams.delete("fromCheckout");
      window.history.replaceState({}, "", url.toString());

      // Start confetti immediately
      setShowConfetti(true);
      
      // Use performance.now() for consistent timing regardless of page load speed
      const startTime = performance.now();
      
      const updatePieceCount = () => {
        const elapsed = performance.now() - startTime;
        
        if (elapsed < 1000) {
          setPieceCount(1000); // Full density for first second
        } else if (elapsed < 1500) {
          setPieceCount(500); // Half density for next 0.5 seconds
        } else if (elapsed < 2000) {
          setPieceCount(200); // Low density for next 0.5 seconds
        } else {
          setPieceCount(0); // Stop spawning after 2 seconds
          return; // Stop the animation loop
        }
        
        requestAnimationFrame(updatePieceCount);
      };
      
      requestAnimationFrame(updatePieceCount);
    }
  }, []);

  if (!showConfetti) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      pointerEvents: 'none',
      overflow: 'visible',
    }}>
      <Confetti
        width={windowDimensions.width || window.innerWidth}
        height={windowDimensions.height || window.innerHeight}
        recycle={false}
        numberOfPieces={pieceCount}
        gravity={1.2}
        initialVelocityY={10}
        run={showConfetti}
        colors={[
          "#4CAF50", // Green
          "#FF9800", // Orange
          "#E91E63", // Pink
          "#9C27B0", // Purple
          "#2196F3", // Blue
        ]}
      />
    </div>
  );
}
