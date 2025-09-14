"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";

type NotificationPermission = 'default' | 'denied' | 'granted';

interface NotificationSettingsConfig {
  likes: boolean;
  comments: boolean;
  followers: boolean;
  mentions: boolean;
  followRequests: boolean;
}

export default function NotificationSettings() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permissions, setPermissions] = useState<NotificationPermission>("default");
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsConfig>({
    likes: true,
    comments: true,
    followers: true,
    mentions: true,
    followRequests: true,
  });
  
  const { requestPermission, sendTestNotification, updateSettings, getSettings, getStatus } = useNotifications();

  useEffect(() => {
    // Check current notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissions(Notification.permission as NotificationPermission);
      setPushEnabled(Notification.permission === "granted");
    }
    
    // Load notification settings
    const settings = getSettings();
    setNotificationSettings(settings);
  }, [getSettings]);

  const requestNotificationPermission = async () => {
    try {
      const permission = await requestPermission();
      setPermissions(permission);
      setPushEnabled(permission === "granted");

      if (permission === "granted") {
        // Show a test notification
        await sendTestNotification();
      }
    } catch (error: unknown) {
      console.error("Error requesting notification permission:", error);
      const errorMessage = error instanceof Error ? error.message : "This browser does not support notifications";
      alert(errorMessage);
    }
  };

  const sendTestNotificationHandler = async () => {
    const status = getStatus();
    console.log('Notification Service Status:', status);
    
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      await sendTestNotification();
    } else {
      console.warn('Notification permission not granted:', typeof window !== "undefined" && "Notification" in window ? Notification.permission : "Notifications not supported");
    }
  };

  const showDebugInfo = () => {
    const status = getStatus();
    alert(`Debug Info:\n${JSON.stringify(status, null, 2)}`);
  };

  const handleNotificationSettingChange = (setting: keyof NotificationSettingsConfig, enabled: boolean) => {
    const newSettings = { ...notificationSettings, [setting]: enabled };
    setNotificationSettings(newSettings);
    updateSettings(newSettings);
  };

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-heading4-medium text-light-1">
          Push Notifications
        </h3>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="mb-2 text-body-semibold text-light-1">Browser Notifications</h4>
              <p className="mb-3 text-small-regular text-gray-1">
                Get notified about likes, comments, new followers, and mentions even when Chirp is closed.
              </p>
              <div className={`rounded-lg border-l-4 p-4 ${
                permissions === "granted" 
                  ? "border-green-500 bg-green-900/20" 
                  : permissions === "denied"
                  ? "border-red-500 bg-red-900/20"
                  : "border-yellow-500 bg-yellow-900/20"
              }`}>
                <p className="mb-1 text-small-semibold text-light-1">
                  Status: {
                    permissions === "granted" ? "Enabled" :
                    permissions === "denied" ? "Blocked" : "Not enabled"
                  }
                </p>
                <p className="text-small-regular text-gray-1">
                  {permissions === "granted" && "Notifications are working! You'll receive updates in real-time."}
                  {permissions === "denied" && "Notifications are blocked. You can enable them in your browser settings."}
                  {permissions === "default" && "Click the toggle to enable browser notifications."}
                </p>
              </div>
            </div>
            <div className="ml-6 space-y-2">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={pushEnabled}
                  onChange={() => {
                    if (!pushEnabled && permissions !== "granted") {
                      requestNotificationPermission();
                    } else {
                      setPushEnabled(!pushEnabled);
                    }
                  }}
                />
                <div className="peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600 peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 dark:border-gray-600 dark:bg-gray-700"></div>
              </label>
              {pushEnabled && (
                <div className="space-y-2">
                  <button
                    onClick={sendTestNotificationHandler}
                    className="hover:bg-primary-600 block w-full rounded-md bg-primary-500 px-3 py-1 text-xs text-white transition-colors"
                  >
                    Test
                  </button>
                  <button
                    onClick={showDebugInfo}
                    className="block w-full rounded-md bg-gray-600 px-3 py-1 text-xs text-white transition-colors hover:bg-gray-700"
                  >
                    Debug
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-heading4-medium text-light-1">
          Notification Types
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Likes</p>
              <p className="text-small-regular text-gray-1">When someone likes your posts</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={notificationSettings.likes}
                onChange={(e) => handleNotificationSettingChange('likes', e.target.checked)}
              />
              <div className="peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600 peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Comments</p>
              <p className="text-small-regular text-gray-1">When someone comments on your posts</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={notificationSettings.comments}
                onChange={(e) => handleNotificationSettingChange('comments', e.target.checked)}
              />
              <div className="peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600 peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">New Followers</p>
              <p className="text-small-regular text-gray-1">When someone follows you</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={notificationSettings.followers}
                onChange={(e) => handleNotificationSettingChange('followers', e.target.checked)}
              />
              <div className="peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600 peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Mentions</p>
              <p className="text-small-regular text-gray-1">When someone mentions you</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={notificationSettings.mentions}
                onChange={(e) => handleNotificationSettingChange('mentions', e.target.checked)}
              />
              <div className="peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600 peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Follow Requests</p>
              <p className="text-small-regular text-gray-1">When someone requests to follow your private account</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={notificationSettings.followRequests}
                onChange={(e) => handleNotificationSettingChange('followRequests', e.target.checked)}
              />
              <div className="peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600 peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-heading4-medium text-light-1">
          Email Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Weekly Summary</p>
              <p className="text-small-regular text-gray-1">Get a weekly summary of your activity</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600 peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Product Updates</p>
              <p className="text-small-regular text-gray-1">New features and platform updates</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600 peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}