"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface MediaItem {
  type: string;
  url: string;
  filename?: string;
  size?: number;
}

interface MediaGalleryProps {
  media: MediaItem[];
  className?: string;
}

export default function MediaGallery({ media, className = "" }: MediaGalleryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const sliderRef = useRef<Slider>(null);

  // Settings for the carousel
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    beforeChange: (oldIndex: number, newIndex: number) => setCurrentSlide(newIndex),
    appendDots: (dots: React.ReactNode) => (
      <div className="absolute bottom-4 left-0 right-0">
        <ul className="flex justify-center space-x-2"> 
          {dots}
        </ul>
      </div>
    ),
    customPaging: (i: number) => (
      <div className="w-3 h-3 rounded-full bg-white/50 border border-white/30 hover:bg-white transition-colors"></div>
    ),
  };

  // Handle fullscreen toggle
  const toggleFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setIsFullscreen(true);
    document.body.style.overflow = "hidden"; // Prevent scrolling when fullscreen
  };

  // Close fullscreen
  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = "auto"; // Re-enable scrolling
  };

  // Handle keyboard navigation in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      
      if (e.key === "Escape") {
        closeFullscreen();
      } else if (e.key === "ArrowLeft") {
        setFullscreenIndex(prev => (prev > 0 ? prev - 1 : media.length - 1));
      } else if (e.key === "ArrowRight") {
        setFullscreenIndex(prev => (prev < media.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, media.length]);

  if (media.length === 0) return null;

  return (
    <>
      {/* Gallery Carousel */}
      <div className={`media-gallery-container ${className}`}>
        <Slider ref={sliderRef} {...settings}>
          {media.map((item, index) => (
            <div key={index} className="relative aspect-square md:aspect-video">
              {item.type.startsWith("image") ? (
                <div 
                  className="media-gallery-item"
                  onClick={() => toggleFullscreen(index)}
                >
                  <Image
                    src={item.url}
                    alt={item.filename || `Media ${index + 1}`}
                    fill
                    className="media-gallery-image"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index === 0} // Priority for first image
                  />
                  {/* Fullscreen icon overlay */}
                  <div className="media-gallery-overlay">
                    <div className="media-gallery-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : item.type.startsWith("video") ? (
                <div className="relative w-full h-full group">
                  <video
                    src={item.url}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                  />
                  {/* Play icon overlay */}
                  <div className="media-gallery-overlay">
                    <div className="media-gallery-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-dark-2">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">
                      {item.type.includes("audio") ? "🎵" : 
                       item.type.includes("pdf") ? "📄" : 
                       item.type.includes("doc") ? "📝" : "📎"}
                    </div>
                    <p className="text-light-1 text-sm truncate max-w-xs">
                      {item.filename || "File"}
                    </p>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-400 text-sm mt-2 inline-block"
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Slider>
        
        {/* Slide counter */}
        {media.length > 1 && (
          <div className="media-gallery-counter">
            {currentSlide + 1} / {media.length}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="media-gallery-fullscreen"
          onClick={closeFullscreen}
        >
          <div 
            className="media-gallery-fullscreen-content"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on media
          >
            {media[fullscreenIndex]?.type.startsWith("image") ? (
              <div className="relative w-full h-full">
                <Image
                  src={media[fullscreenIndex].url}
                  alt={media[fullscreenIndex].filename || `Media ${fullscreenIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : media[fullscreenIndex]?.type.startsWith("video") ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  src={media[fullscreenIndex].url}
                  className="max-w-full max-h-full"
                  controls
                  autoPlay
                  playsInline
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {media[fullscreenIndex]?.type.includes("audio") ? "🎵" : 
                     media[fullscreenIndex]?.type.includes("pdf") ? "📄" : 
                     media[fullscreenIndex]?.type.includes("doc") ? "📝" : "📎"}
                  </div>
                  <p className="text-white text-xl mb-4">
                    {media[fullscreenIndex]?.filename || "File"}
                  </p>
                  <a 
                    href={media[fullscreenIndex]?.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:text-primary-400 text-lg"
                  >
                    Download File
                  </a>
                </div>
              </div>
            )}
            
            {/* Navigation arrows */}
            {media.length > 1 && (
              <>
                <button
                  className="media-gallery-nav-button left-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenIndex(prev => (prev > 0 ? prev - 1 : media.length - 1));
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  className="media-gallery-nav-button right-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenIndex(prev => (prev < media.length - 1 ? prev + 1 : 0));
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Close button */}
            <button
              className="media-gallery-close-button"
              onClick={closeFullscreen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Counter */}
            {media.length > 1 && (
              <div className="media-gallery-fullscreen-counter">
                {fullscreenIndex + 1} / {media.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}