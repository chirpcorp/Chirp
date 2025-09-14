"use client";

import { useNotifications } from '@/hooks/useNotifications';
import { useUser } from '@clerk/nextjs';

export default function NotificationDemo() {
  const { user } = useUser();
  const { sendNotification, requestPermission, sendTestNotification } = useNotifications(user?.id);

  const handleTestLikeNotification = async () => {
    await sendNotification({
      type: 'like',
      recipientUserId: user?.id || '',
      triggeredBy: {
        id: 'demo-user',
        name: 'Demo User',
      },
      content: {
        chirpText: 'This is a test chirp that was liked!',
      },
      timestamp: new Date().toISOString(),
    });
  };

  const handleTestCommentNotification = async () => {
    await sendNotification({
      type: 'comment',
      recipientUserId: user?.id || '',
      triggeredBy: {
        id: 'demo-user',
        name: 'Demo User',
      },
      content: {
        originalChirpText: 'Your original chirp',
        commentText: 'This is a test comment!',
      },
      timestamp: new Date().toISOString(),
    });
  };

  const handleTestMentionNotification = async () => {
    await sendNotification({
      type: 'mention',
      recipientUserId: user?.id || '',
      triggeredBy: {
        id: 'demo-user',
        name: 'Demo User',
      },
      content: {
        chirpText: `Hey @${user?.username || 'user'}, you were mentioned in this chirp!`,
      },
      timestamp: new Date().toISOString(),
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl bg-dark-2 p-6">
      <h3 className="mb-4 text-heading4-medium text-light-1">
        🔔 Notification Demo
      </h3>
      <p className="mb-4 text-small-regular text-gray-1">
        Test the notification system with the buttons below. Make sure you&apos;ve enabled notifications in Settings first!
      </p>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={requestPermission}
          className="hover:bg-primary-600 text-sm rounded-lg bg-primary-500 px-4 py-2 text-white transition-colors"
        >
          Enable Notifications
        </button>
        
        <button
          onClick={sendTestNotification}
          className="hover:bg-secondary-600 text-sm rounded-lg bg-secondary-500 px-4 py-2 text-white transition-colors"
        >
          Test General
        </button>
        
        <button
          onClick={handleTestLikeNotification}
          className="text-sm rounded-lg bg-blue px-4 py-2 text-white transition-colors hover:bg-blue/80"
        >
          Test Like ❤️
        </button>
        
        <button
          onClick={handleTestCommentNotification}
          className="text-sm rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
        >
          Test Comment 💬
        </button>
        
        <button
          onClick={handleTestMentionNotification}
          className="text-sm rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600"
        >
          Test Mention 🏷️
        </button>
      </div>
    </div>
  );
}