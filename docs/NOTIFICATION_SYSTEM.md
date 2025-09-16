# Chirp Notification System

## Overview

The notification system has been completely redesigned to work properly with Next.js 15 server/client architecture. The previous runtime error has been fixed by separating server-side notification triggers from client-side notification delivery.

## Recent Fix: Service Worker Registration Error

### Problem
Users encountered "Registration does not have an active worker" error when testing notifications. This occurred because:
- Service Worker registration existed but wasn't fully activated
- No proper waiting for Service Worker to become ready
- Missing fallback when Service Worker isn't available

### Solution
- **Enhanced initialization**: Service Worker now waits for full activation before use
- **Smart fallback**: Automatically uses direct notifications when Service Worker isn't ready
- **Better error handling**: Graceful degradation with detailed logging
- **Debug tools**: Added status checking and debug utilities

## Architecture

### Server-Side Components
- **`/lib/notifications/triggers.ts`**: Server-side functions that create notification payloads when user interactions occur
- **Chirp/User Actions**: Integration points that trigger notifications for likes, comments, mentions, follows, etc.

### Client-Side Components
- **`/lib/services/notificationService.ts`**: Browser notification service with Service Worker integration
- **`/hooks/useNotifications.ts`**: React hook for managing notifications in components
- **`/components/providers/NotificationProvider.tsx`**: Context provider for notification state management
- **`/components/settings/NotificationSettings.tsx`**: Enhanced settings UI with granular controls

## Key Features

### ✅ **Fixed Issues**
- **Runtime Error Fixed**: Separated server/client notification logic
- **Theme System Fixed**: Enhanced theme switching with proper persistence
- **Modern Settings UI**: Responsive design with mobile/desktop layouts

### 🔔 **Notification Types**
- **Like Notifications**: When someone likes your chirps
- **Comment Notifications**: When someone comments on your chirps
- **Mention Notifications**: When someone mentions you in a chirp (`@username`)
- **Follow Notifications**: When someone follows you
- **Follow Request Notifications**: When someone requests to follow your private account

### ⚙️ **Settings & Controls**
- **Granular Settings**: Individual toggles for each notification type
- **Permission Management**: Browser notification permission handling
- **Test Functionality**: Test notifications to verify setup
- **Theme Integration**: Works with the enhanced theme system

## How It Works

### 1. Server-Side Triggers
When user interactions occur (like, comment, mention, follow), server actions call trigger functions:

```typescript
// Example: When a user likes a chirp
await triggerLikeNotification(chirpAuthorId, likerId, chirpText);
```

### 2. Client-Side Delivery
The client-side hook handles browser notifications:

```typescript
const { sendNotification, requestPermission } = useNotifications(userId);

// Send a notification
await sendNotification({
  type: 'like',
  recipientUserId: 'user-id',
  triggeredBy: { id: 'liker-id', name: 'Liker Name' },
  content: { chirpText: 'Chirp content...' },
  timestamp: new Date().toISOString()
});
```

## Usage Examples

### Enable Notifications in a Component
```tsx
import { useNotifications } from '@/hooks/useNotifications';

export default function MyComponent() {
  const { requestPermission } = useNotifications();
  
  const handleEnableNotifications = async () => {
    const permission = await requestPermission();
    if (permission === 'granted') {
      console.log('Notifications enabled!');
    }
  };
}
```

### Test Notifications
Use the demo component at `/components/demo/NotificationDemo.tsx` to test the notification system.

## Integration Points

### Current Integrations
- **`/lib/actions/chirp.actions.ts`**: Like, comment, and mention notifications
- **`/lib/actions/user.actions.ts`**: Follow and follow request notifications
- **Settings UI**: Complete notification preferences management

### Service Worker
The enhanced service worker (`/public/sw.js`) handles:
- Background notifications when the app is closed
- Notification click handling with smart URL routing
- Better notification payload processing

## Development Notes

### Server vs Client Separation
- **Server functions** (`triggers.ts`) create notification payloads
- **Client hooks** (`useNotifications.ts`) handle browser notifications
- **No more runtime errors** from mixing server/client code

### Browser Compatibility
- Graceful fallback when Service Worker is unavailable
- Proper permission handling across different browsers
- Type-safe notification options with TypeScript

## Testing

1. Go to **Settings > Notifications** 
2. Click "Enable Notifications" to request browser permissions
3. Toggle notification types on/off
4. Use the test buttons to verify notifications work
5. Try the demo component for comprehensive testing
6. **Use the Debug button** in Settings to check Service Worker status

### Troubleshooting Service Worker Issues

If you encounter "Registration does not have an active worker" error:

1. **Check Status**: Use the Debug button in Notification Settings
2. **Wait for Activation**: Service Worker might still be installing/activating
3. **Clear and Reload**: 
   - Open DevTools → Application → Service Workers
   - Unregister the service worker
   - Refresh the page
4. **Fallback Mode**: System automatically falls back to direct notifications

### Debug Component
Use `/components/debug/ServiceWorkerDebug.tsx` for advanced debugging:
- Real-time status monitoring
- Service Worker reset functionality
- Detailed error logging

The notification system is now fully functional and properly integrated with the Chirp platform! 🎉