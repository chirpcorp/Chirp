"use client";

import { useCallback, useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function ServiceWorkerDebug() {
  const [status, setStatus] = useState<any>(null);
  const { getStatus, requestPermission, sendTestNotification } = useNotifications();

  const updateStatus = useCallback(() => {
    const currentStatus = getStatus();
    setStatus(currentStatus);
    console.log('Service Worker Status:', currentStatus);
  }, [getStatus]);

  useEffect(() => {
    updateStatus();
    // Update status every 2 seconds
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, [updateStatus]);

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
        for (const registration of registrations) {
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
    <div className="mb-6 rounded-xl bg-dark-2 p-6">
      <h3 className="mb-4 text-heading4-medium text-light-1">
        🔧 Service Worker Debug Panel
      </h3>
      
      {status && (
        <div className="mb-6 rounded-lg bg-dark-3 p-4">
          <h4 className="mb-2 text-body-semibold text-light-1">Current Status:</h4>
          <pre className="overflow-x-auto text-xs text-gray-1">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <button
          onClick={updateStatus}
          className="text-sm rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
        >
          Refresh Status
        </button>
        
        <button
          onClick={handleRequestPermission}
          className="hover:bg-primary-600 text-sm rounded-lg bg-primary-500 px-4 py-2 text-white transition-colors"
        >
          Request Permission
        </button>
        
        <button
          onClick={handleTestNotification}
          className="hover:bg-secondary-600 text-sm rounded-lg bg-secondary-500 px-4 py-2 text-white transition-colors"
        >
          Test Notification
        </button>
        
        <button
          onClick={reloadServiceWorker}
          className="text-sm rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
        >
          Reset Service Worker
        </button>
      </div>

      <div className="text-small-regular text-gray-1">
        <p><strong>How to use:</strong></p>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Check the current status above</li>
          <li>If Service Worker is not active, try &quot;Reset Service Worker&quot;</li>
          <li>Click &quot;Request Permission&quot; to enable notifications</li>
          <li>Click &quot;Test Notification&quot; to verify it works</li>
          <li>Check browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  );
}