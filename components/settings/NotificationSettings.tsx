"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type NotificationPermission = 'default' | 'denied' | 'granted';

interface NotificationSettingsConfig {
  likes: boolean;
  comments: boolean;
  followers: boolean;
  mentions: boolean;
  followRequests: boolean;
  weeklySummary: boolean;
  productUpdates: boolean;
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
    weeklySummary: false,
    productUpdates: false,
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
    if (settings) {
      setNotificationSettings({
        likes: settings.likes ?? true,
        comments: settings.comments ?? true,
        followers: settings.followers ?? true,
        mentions: settings.mentions ?? true,
        followRequests: settings.followRequests ?? true,
        weeklySummary: settings.weeklySummary ?? false,
        productUpdates: settings.productUpdates ?? false,
      });
    }
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
            <div className="ml-6 flex flex-col items-end space-y-2">
              <Switch
                checked={pushEnabled}
                onCheckedChange={() => {
                  if (!pushEnabled && permissions !== "granted") {
                    requestNotificationPermission();
                  } else {
                    setPushEnabled(!pushEnabled);
                  }
                }}
                className="data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
              />
              {pushEnabled && (
                <div className="space-y-2">
                  <Button
                    onClick={sendTestNotificationHandler}
                    className="hover:bg-primary-600 block w-full rounded-md bg-primary-500 px-3 py-1 text-xs text-white transition-colors"
                    size="sm"
                  >
                    Test
                  </Button>
                  <Button
                    onClick={showDebugInfo}
                    className="block w-full rounded-md bg-gray-600 px-3 py-1 text-xs text-white transition-colors hover:bg-gray-700"
                    variant="secondary"
                    size="sm"
                  >
                    Debug
                  </Button>
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
            <Switch
              checked={notificationSettings.likes}
              onCheckedChange={(checked) => handleNotificationSettingChange('likes', checked)}
              className="data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Comments</p>
              <p className="text-small-regular text-gray-1">When someone comments on your posts</p>
            </div>
            <Switch
              checked={notificationSettings.comments}
              onCheckedChange={(checked) => handleNotificationSettingChange('comments', checked)}
              className="data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">New Followers</p>
              <p className="text-small-regular text-gray-1">When someone follows you</p>
            </div>
            <Switch
              checked={notificationSettings.followers}
              onCheckedChange={(checked) => handleNotificationSettingChange('followers', checked)}
              className="data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Mentions</p>
              <p className="text-small-regular text-gray-1">When someone mentions you</p>
            </div>
            <Switch
              checked={notificationSettings.mentions}
              onCheckedChange={(checked) => handleNotificationSettingChange('mentions', checked)}
              className="data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Follow Requests</p>
              <p className="text-small-regular text-gray-1">When someone requests to follow your private account</p>
            </div>
            <Switch
              checked={notificationSettings.followRequests}
              onCheckedChange={(checked) => handleNotificationSettingChange('followRequests', checked)}
              className="data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
            />
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
            <Switch
              checked={notificationSettings.weeklySummary}
              onCheckedChange={(checked) => handleNotificationSettingChange('weeklySummary', checked)}
              className="data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Product Updates</p>
              <p className="text-small-regular text-gray-1">New features and platform updates</p>
            </div>
            <Switch
              checked={notificationSettings.productUpdates}
              onCheckedChange={(checked) => handleNotificationSettingChange('productUpdates', checked)}
              className="data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="hover:bg-primary-600 bg-primary-500">
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
}