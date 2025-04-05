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
        // Runs every 5s interval
		}, 5000);

		return () => clearInterval(interval);
	}, [images.length, direction]);

	const goToSlide = (index: number) => {
		setCurrentIndex(index);
	};

	const goToPrevious = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex === 0 ? images.length - 1 : prevIndex - 1
		);
	};

	const goToNext = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex === images.length - 1 ? 0 : prevIndex + 1
		);
	};

	return (
		<div className="relative w-full h-40 sm:h-50 md:h-58 lg:h-64 overflow-hidden rounded-lg shadow-lg mb-10">
			<div
				className="flex w-full h-full transition-transform duration-500 ease-in-out"
				style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
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
			<button
				className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full focus:outline-none hover:bg-opacity-75"
				onClick={goToPrevious}>
				←
			</button>
			<button
				className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full focus:outline-none hover:bg-opacity-75"
				onClick={goToNext}>
				→
			</button>
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
