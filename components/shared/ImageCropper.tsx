"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ 
  src, 
  onCropComplete, 
  onCancel,
  aspectRatio = 1 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Load the image
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setImage(img);
    };
    img.src = src;
  }, [src]);

  // Set container size
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
    }
  }, []);

  // Draw the image on canvas
  useEffect(() => {
    if (!image || !canvasRef.current || containerSize.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = containerSize.width;
    canvas.height = containerSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate image dimensions to fit container while maintaining aspect ratio
    const containerAspectRatio = containerSize.width / containerSize.height;
    const imageAspectRatio = image.width / image.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      drawHeight = containerSize.height;
      drawWidth = image.width * (drawHeight / image.height);
      offsetX = (containerSize.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Image is taller than container
      drawWidth = containerSize.width;
      drawHeight = image.height * (drawWidth / image.width);
      offsetX = 0;
      offsetY = (containerSize.height - drawHeight) / 2;
    }

    // Apply scaling and position
    const scaledWidth = drawWidth * scale;
    const scaledHeight = drawHeight * scale;
    const scaledOffsetX = offsetX + position.x;
    const scaledOffsetY = offsetY + position.y;

    // Draw image
    ctx.drawImage(
      image,
      scaledOffsetX,
      scaledOffsetY,
      scaledWidth,
      scaledHeight
    );

    // Draw cropping overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cropping area (circle for profile pictures)
    const cropSize = Math.min(containerSize.width, containerSize.height) * 0.8;
    const cropX = (containerSize.width - cropSize) / 2;
    const cropY = (containerSize.height - cropSize) / 2;

    // Clear the cropping area
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      containerSize.width / 2,
      containerSize.height / 2,
      cropSize / 2,
      0,
      2 * Math.PI
    );
    ctx.clip();
    ctx.clearRect(cropX, cropY, cropSize, cropSize);
    ctx.restore();

    // Draw the actual image in the cropping area
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      containerSize.width / 2,
      containerSize.height / 2,
      cropSize / 2,
      0,
      2 * Math.PI
    );
    ctx.clip();
    
    ctx.drawImage(
      image,
      scaledOffsetX,
      scaledOffsetY,
      scaledWidth,
      scaledHeight
    );
    ctx.restore();

    // Draw cropping border
    ctx.beginPath();
    ctx.arc(
      containerSize.width / 2,
      containerSize.height / 2,
      cropSize / 2,
      0,
      2 * Math.PI
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "white";
    ctx.stroke();
  }, [image, scale, position, containerSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(1, Math.min(3, prev + delta)));
  };

  const handlePinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsDragging(true);
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isDragging) {
      // Simple pinch zoom implementation
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      setScale(prev => Math.max(1, Math.min(3, prev + (distance > 200 ? 0.05 : -0.05))));
    }
  };

  const handlePinchEnd = () => {
    setIsDragging(false);
  };

  const getCroppedImage = () => {
    if (!image || !canvasRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cropSize = Math.min(containerSize.width, containerSize.height) * 0.8;
    canvas.width = cropSize;
    canvas.height = cropSize;

    // Calculate the position and scale of the image relative to the crop area
    const containerAspectRatio = containerSize.width / containerSize.height;
    const imageAspectRatio = image.width / image.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imageAspectRatio > containerAspectRatio) {
      drawHeight = containerSize.height;
      drawWidth = image.width * (drawHeight / image.height);
      offsetX = (containerSize.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = containerSize.width;
      drawHeight = image.height * (drawWidth / image.width);
      offsetX = 0;
      offsetY = (containerSize.height - drawHeight) / 2;
    }

    const scaledWidth = drawWidth * scale;
    const scaledHeight = drawHeight * scale;
    const scaledOffsetX = offsetX + position.x;
    const scaledOffsetY = offsetY + position.y;

    // Calculate the offset to center the crop
    const cropX = (containerSize.width - cropSize) / 2;
    const cropY = (containerSize.height - cropSize) / 2;

    // Draw the cropped image
    ctx.drawImage(
      image,
      scaledOffsetX - cropX,
      scaledOffsetY - cropY,
      scaledWidth,
      scaledHeight,
      0,
      0,
      cropSize,
      cropSize
    );

    // Convert to data URL and pass to callback
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedImageUrl = URL.createObjectURL(blob);
        onCropComplete(croppedImageUrl);
      }
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-2xl rounded-lg bg-dark-2 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-heading4-medium text-light-1">Adjust Image</h2>
          <button 
            onClick={onCancel}
            className="text-2xl text-gray-1 hover:text-light-1"
          >
            ×
          </button>
        </div>
        
        <div 
          ref={containerRef}
          className="relative h-96 w-full overflow-hidden rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handlePinchStart}
          onTouchMove={handlePinchMove}
          onTouchEnd={handlePinchEnd}
        >
          <canvas 
            ref={canvasRef} 
            className="size-full"
          />
        </div>
        
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-small-medium text-light-2">Zoom:</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setScale(prev => Math.max(1, prev - 0.1))}
                className="rounded bg-dark-3 p-2 text-light-1 hover:bg-dark-4"
                disabled={scale <= 1}
              >
                -
              </button>
              <span className="text-small-medium text-light-1">
                {Math.round((scale - 1) * 100)}%
              </span>
              <button 
                onClick={() => setScale(prev => Math.min(3, prev + 0.1))}
                className="rounded bg-dark-3 p-2 text-light-1 hover:bg-dark-4"
                disabled={scale >= 3}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={onCancel}
              className="flex-1 bg-dark-3 hover:bg-dark-4"
            >
              Cancel
            </Button>
            <Button 
              onClick={getCroppedImage}
              className="hover:bg-primary-600 flex-1 bg-primary-500"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;