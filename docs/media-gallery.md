# Media Gallery Component

The Media Gallery component is a reusable React component that displays media files (images, videos, and other file types) in a carousel with fullscreen viewing capabilities.

## Features

- **Carousel Slider**: Displays multiple media files in a responsive carousel with navigation dots
- **Fullscreen Viewing**: Click on any image to view it in fullscreen mode
- **Keyboard Navigation**: Use arrow keys to navigate between media items in fullscreen mode
- **Video Support**: Plays videos inline and in fullscreen mode
- **File Type Support**: Handles images, videos, audio files, documents, and other file types
- **Responsive Design**: Works on all device sizes
- **Touch Support**: Swipe gestures for mobile devices

## Usage

```jsx
import MediaGallery from "@/components/shared/MediaGallery";

const mediaFiles = [
  {
    type: "image",
    url: "https://example.com/image1.jpg",
    filename: "image1.jpg"
  },
  {
    type: "video",
    url: "https://example.com/video1.mp4",
    filename: "video1.mp4"
  }
];

<MediaGallery media={mediaFiles} className="max-h-96" />
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| media | MediaItem[] | Array of media items to display |
| className | string | Additional CSS classes to apply to the container |

## MediaItem Interface

```typescript
interface MediaItem {
  type: string;        // MIME type or custom type (e.g., "image", "video")
  url: string;         // URL to the media file
  filename?: string;   // Optional filename
  size?: number;       // Optional file size in bytes
}
```

## Styling

The component uses Tailwind CSS classes and can be customized with additional classes passed via the `className` prop. Custom CSS classes are defined in `app/globals.css`.

## Navigation

- **Carousel Navigation**: Click dots or use arrow buttons
- **Fullscreen Navigation**: 
  - Arrow keys (left/right) to navigate
  - ESC key or close button to exit
  - Navigation arrows on screen

## Implementation Details

The component uses:
- `react-slick` for the carousel functionality
- `next/image` for optimized image loading
- Custom CSS for styling and transitions
- Keyboard event listeners for fullscreen navigation