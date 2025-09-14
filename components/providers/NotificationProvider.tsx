"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationContextType {
  sendNotification: (payload: any) => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
  sendTestNotification: () => Promise<void>;
  updateSettings: (settings: any) => void;
  getSettings: () => any;
  permissions: NotificationPermission;
  isSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  currentUserId?: string;
}

export function NotificationProvider({ children, currentUserId }: NotificationProviderProps) {
  const [permissions, setPermissions] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  
  const notifications = useNotifications(currentUserId);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermissions(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const permission = await notifications.requestPermission();
    setPermissions(permission);
    return permission;
  };

  const contextValue: NotificationContextType = {
    sendNotification: notifications.sendNotification,
    requestPermission: handleRequestPermission,
    sendTestNotification: notifications.sendTestNotification,
    updateSettings: notifications.updateSettings,
    getSettings: notifications.getSettings,
    permissions,
    isSupported,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}

// Optional: Hook to use notifications without context (for backward compatibility)
export function useClientNotifications(currentUserId?: string) {
  return useNotifications(currentUserId);
}