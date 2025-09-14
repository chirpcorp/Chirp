"use client";

import MediaGallery from "@/components/shared/MediaGallery";

export default function GalleryTest() {
  const sampleMedia = [
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      filename: "mountain.jpg"
    },
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      filename: "forest.jpg"
    },
    {
      type: "video",
      url: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      filename: "sample-video.mp4"
    }
  ];

  return (
    <div className="min-h-screen bg-dark-1 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-light-1 mb-8">Media Gallery Test</h1>
        
        <div className="bg-dark-2 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-light-1 mb-4">Sample Media Gallery</h2>
          <MediaGallery media={sampleMedia} className="max-h-96" />
        </div>
        
        <div className="bg-dark-2 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-light-1 mb-4">Instructions</h2>
          <ul className="text-light-1 space-y-2">
            <li>• Click on any image to view it in fullscreen mode</li>
            <li>• Use arrow keys or navigation buttons to move between media items</li>
            <li>• Press ESC or click the close button to exit fullscreen mode</li>
            <li>• Videos will play inline or in fullscreen mode</li>
          </ul>
        </div>
      </div>
    </div>
  );
}