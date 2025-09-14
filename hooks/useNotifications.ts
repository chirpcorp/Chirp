"use client";

import { useEffect, useCallback } from 'react';
import NotificationService from '@/lib/services/notificationService';

interface NotificationPayload {
  type: 'like' | 'comment' | 'mention' | 'follow' | 'follow-request';
  recipientUserId: string;
  triggeredBy: {
    id: string;
    name: string;
  };
  content: {
    chirpText?: string;
    originalChirpText?: string;
    commentText?: string;
  };
  timestamp: string;
}

export function useNotifications(currentUserId?: string) {
  const notificationService = NotificationService.getInstance();

  const sendNotification = useCallback(async (payload: NotificationPayload) => {
    // Only send notification if it's for the current user
    if (!currentUserId || payload.recipientUserId !== currentUserId) {
      return;
    }

    try {
      switch (payload.type) {
        case 'like':
          await notificationService.notifyLike(
            payload.triggeredBy.name,
            payload.content.chirpText || ''
          );
          break;
        case 'comment':
          await notificationService.notifyComment(
            payload.triggeredBy.name,
            payload.content.originalChirpText || '',
            payload.content.commentText || ''
          );
          break;
        case 'mention':
          await notificationService.notifyMention(
            payload.triggeredBy.name,
            payload.content.chirpText || ''
          );
          break;
        case 'follow':
          await notificationService.notifyFollow(payload.triggeredBy.name);
          break;
        case 'follow-request':
          await notificationService.notifyFollowRequest(payload.triggeredBy.name);
          break;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [notificationService, currentUserId]);

  const requestPermission = useCallback(async () => {
    try {
      return await notificationService.requestPermission();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied' as NotificationPermission;
    }
  }, [notificationService]);

  const sendTestNotification = useCallback(async () => {
    try {
      await notificationService.sendTestNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, [notificationService]);

  const updateSettings = useCallback((settings: any) => {
    notificationService.updateSettings(settings);
  }, [notificationService]);

  const getSettings = useCallback(() => {
    return notificationService.getSettings();
  }, [notificationService]);

  const getStatus = useCallback(() => {
    return notificationService.getStatus();
  }, [notificationService]);

  return {
    sendNotification,
    requestPermission,
    sendTestNotification,
    updateSettings,
    getSettings,
    getStatus,
  };
}