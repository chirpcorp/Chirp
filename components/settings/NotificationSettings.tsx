"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationSettings {
  likes: boolean;
  comments: boolean;
  followers: boolean;
  mentions: boolean;
  followRequests: boolean;
}

export default function NotificationSettings() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permissions, setPermissions] = useState<NotificationPermission>("default");
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
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
      setPermissions(Notification.permission);
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
    
    if (Notification.permission === "granted") {
      await sendTestNotification();
    } else {
      console.warn('Notification permission not granted:', Notification.permission);
    }
  };

  const showDebugInfo = () => {
    const status = getStatus();
    alert(`Debug Info:\n${JSON.stringify(status, null, 2)}`);
  };

  const handleNotificationSettingChange = (setting: keyof NotificationSettings, enabled: boolean) => {
    const newSettings = { ...notificationSettings, [setting]: enabled };
    setNotificationSettings(newSettings);
    updateSettings(newSettings);
  };

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <div className="bg-dark-2 rounded-xl p-6">
        <h3 className="text-heading4-medium text-light-1 mb-4">
          Push Notifications
        </h3>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-body-semibold text-light-1 mb-2">Browser Notifications</h4>
              <p className="text-small-regular text-gray-1 mb-3">
                Get notified about likes, comments, new followers, and mentions even when Chirp is closed.
              </p>
              <div className={`rounded-lg p-4 border-l-4 ${
                permissions === "granted" 
                  ? "bg-green-900/20 border-green-500" 
                  : permissions === "denied"
                  ? "bg-red-900/20 border-red-500"
                  : "bg-yellow-900/20 border-yellow-500"
              }`}>
                <p className="text-small-semibold text-light-1 mb-1">
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
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pushEnabled}
                  onChange={() => {
                    if (!pushEnabled && permissions !== "granted") {
                      requestNotificationPermission();
                    } else {
                      setPushEnabled(!pushEnabled);
                    }
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
              {pushEnabled && (
                <div className="space-y-2">
                  <button
                    onClick={sendTestNotificationHandler}
                    className="block w-full text-xs bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-md transition-colors"
                  >
                    Test
                  </button>
                  <button
                    onClick={showDebugInfo}
                    className="block w-full text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors"
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
      <div className="bg-dark-2 rounded-xl p-6">
        <h3 className="text-heading4-medium text-light-1 mb-4">
          Notification Types
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Likes</p>
              <p className="text-small-regular text-gray-1">When someone likes your posts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notificationSettings.likes}
                onChange={(e) => handleNotificationSettingChange('likes', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Comments</p>
              <p className="text-small-regular text-gray-1">When someone comments on your posts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notificationSettings.comments}
                onChange={(e) => handleNotificationSettingChange('comments', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">New Followers</p>
              <p className="text-small-regular text-gray-1">When someone follows you</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notificationSettings.followers}
                onChange={(e) => handleNotificationSettingChange('followers', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Mentions</p>
              <p className="text-small-regular text-gray-1">When someone mentions you</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notificationSettings.mentions}
                onChange={(e) => handleNotificationSettingChange('mentions', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Follow Requests</p>
              <p className="text-small-regular text-gray-1">When someone requests to follow your private account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notificationSettings.followRequests}
                onChange={(e) => handleNotificationSettingChange('followRequests', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-dark-2 rounded-xl p-6">
        <h3 className="text-heading4-medium text-light-1 mb-4">
          Email Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Weekly Summary</p>
              <p className="text-small-regular text-gray-1">Get a weekly summary of your activity</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Product Updates</p>
              <p className="text-small-regular text-gray-1">New features and platform updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}