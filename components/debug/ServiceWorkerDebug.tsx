"use client";

import { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function ServiceWorkerDebug() {
  const [status, setStatus] = useState<any>(null);
  const { getStatus, requestPermission, sendTestNotification } = useNotifications();

  const updateStatus = () => {
    const currentStatus = getStatus();
    setStatus(currentStatus);
    console.log('Service Worker Status:', currentStatus);
  };

  useEffect(() => {
    updateStatus();
    // Update status every 2 seconds
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, [getStatus]);

  const handleRequestPermission = async () => {
    try {
      const permission = await requestPermission();
      console.log('Permission result:', permission);
      updateStatus();
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      console.log('Test notification sent');
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  const reloadServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
        console.log('All service workers unregistered');
        // Reload the page to re-register
        window.location.reload();
      } catch (error) {
        console.error('Failed to unregister service workers:', error);
      }
    }
  };

  return (
    <div className="bg-dark-2 rounded-xl p-6 mb-6">
      <h3 className="text-heading4-medium text-light-1 mb-4">
        🔧 Service Worker Debug Panel
      </h3>
      
      {status && (
        <div className="mb-6 bg-dark-3 rounded-lg p-4">
          <h4 className="text-body-semibold text-light-1 mb-2">Current Status:</h4>
          <pre className="text-xs text-gray-1 overflow-x-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={updateStatus}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
        >
          Refresh Status
        </button>
        
        <button
          onClick={handleRequestPermission}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
        >
          Request Permission
        </button>
        
        <button
          onClick={handleTestNotification}
          className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg text-sm transition-colors"
        >
          Test Notification
        </button>
        
        <button
          onClick={reloadServiceWorker}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
        >
          Reset Service Worker
        </button>
      </div>

      <div className="text-small-regular text-gray-1">
        <p><strong>How to use:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Check the current status above</li>
          <li>If Service Worker is not active, try "Reset Service Worker"</li>
          <li>Click "Request Permission" to enable notifications</li>
          <li>Click "Test Notification" to verify it works</li>
          <li>Check browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  );
}