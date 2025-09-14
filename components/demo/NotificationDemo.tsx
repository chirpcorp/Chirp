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
    <div className="bg-dark-2 rounded-xl p-6 mb-6">
      <h3 className="text-heading4-medium text-light-1 mb-4">
        🔔 Notification Demo
      </h3>
      <p className="text-small-regular text-gray-1 mb-4">
        Test the notification system with the buttons below. Make sure you've enabled notifications in Settings first!
      </p>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={requestPermission}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
        >
          Enable Notifications
        </button>
        
        <button
          onClick={sendTestNotification}
          className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg text-sm transition-colors"
        >
          Test General
        </button>
        
        <button
          onClick={handleTestLikeNotification}
          className="px-4 py-2 bg-blue hover:bg-blue/80 text-white rounded-lg text-sm transition-colors"
        >
          Test Like ❤️
        </button>
        
        <button
          onClick={handleTestCommentNotification}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
        >
          Test Comment 💬
        </button>
        
        <button
          onClick={handleTestMentionNotification}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
        >
          Test Mention 🏷️
        </button>
      </div>
    </div>
  );
}