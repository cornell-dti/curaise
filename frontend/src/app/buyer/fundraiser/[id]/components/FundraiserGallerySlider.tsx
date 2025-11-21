"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      // Runs every 5s
    }, 5000);

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
    <div className="relative w-full h-[600px] overflow-hidden rounded-lg">
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

      {/* Previous and Next Buttons */}
      {/* {currentIndex !== 0 ? (
        <button
          className="absolute top-1/2 -translate-y-1/2 left-0 flex items-center justify-center w-10 h-24 text-2xl text-black bg-white bg-opacity-60 cursor-pointer rounded-r-full hover:bg-opacity-80 transition-colors duration-300"
          onClick={goToPrevious}
        >
          <ChevronLeft />
        </button>
      ) : null}
      {currentIndex !== images.length - 1 ? (
        <button
          className="absolute top-1/2 -translate-y-1/2 right-0 flex items-center justify-center w-10 h-24 text-2xl text-black bg-white bg-opacity-80 cursor-pointer rounded-l-full"
          onClick={goToNext}
        >
          <ChevronRight />
        </button>
      ) : null} */}

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full focus:outline-none ${
              index === currentIndex ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
