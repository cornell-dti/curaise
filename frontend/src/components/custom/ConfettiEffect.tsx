"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";

export function ConfettiEffect() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Check if user came from checkout by looking at URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isFromCheckout = urlParams.get("fromCheckout") === "true";
    
    if (isFromCheckout) {
      setShowConfetti(true);
      
      // Update window dimensions
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

       // Stop confetti after 1 second
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 1000);

      // Clean up URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("fromCheckout");
      window.history.replaceState({}, "", url.toString());

      return () => clearTimeout(timer);
    }
  }, []);

  if (!showConfetti) return null;

  return (
    <Confetti
      width={windowDimensions.width || window.innerWidth}
      height={windowDimensions.height || window.innerHeight}
      recycle={false}
      numberOfPieces={1500}
      gravity={2.0}
      initialVelocityY={50}
      colors={[
        "#4CAF50", // Green
        "#FF9800", // Orange
        "#E91E63", // Pink
        "#9C27B0", // Purple
        "#2196F3", // Blue
      ]}
    />
  );
}
