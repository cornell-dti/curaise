"use client";
import { useState, useEffect } from "react";

interface FundraiserGallerySliderProps {
  images: string[];
}

export function FundraiserGallerySlider({
  images,
}: FundraiserGallerySliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("forward");

  useEffect(() => {
    const interval = setInterval(() => {
      if (direction === "forward") {
        // If the current index is the last image, set slider direction to backward else
        // continue sliding forward
        setCurrentIndex((prevIndex) => {
          if (prevIndex === images.length - 1) {
            setDirection("backward");
            return prevIndex - 1;
          }
          return prevIndex + 1;
        });
      } else {
        // If the current index is the first image, set slider direction to forward else
        // continue sliding backward
        setCurrentIndex((prevIndex) => {
          if (prevIndex === 0) {
            setDirection("forward");
            return prevIndex + 1;
          }
          return prevIndex - 1;
        });
      }
      // Runs every 3s interval
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length, currentIndex]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => prevIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  return (
    <div className="relative w-full h-40 sm:h-50 md:h-58 lg:h-64 overflow-hidden rounded-lg shadow-lg mb-10">
      <div
        className="flex w-full h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div key={index} className="flex-shrink-0 w-full h-full">
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      {currentIndex !== 0 ? (
        <button
          className="absolute top-1/2 -translate-y-1/2 left-0 flex items-center justify-center w-10 h-24 text-2xl text-black bg-white bg-opacity-60 cursor-pointer rounded-r-full hover:bg-opacity-80 transition-colors duration-300"
          onClick={goToPrevious}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      ) : null}
      {currentIndex !== images.length - 1 ? (
        <button
          className="absolute top-1/2 -translate-y-1/2 right-0 flex items-center justify-center w-10 h-24 text-2xl text-black bg-white bg-opacity-80 cursor-pointer rounded-l-full"
          onClick={goToNext}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      ) : null}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full focus:outline-none ${
              index === currentIndex ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
