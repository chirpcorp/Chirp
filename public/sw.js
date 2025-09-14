// Service Worker for Push Notifications
const CACHE_NAME = 'chirp-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened successfully');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        // Take control immediately instead of waiting
        return self.skipWaiting();
      })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated successfully');
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  let notificationData;
  
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('Error parsing push data:', error);
    notificationData = {
      title: 'Chirp',
      body: event.data ? event.data.text() : 'New notification from Chirp!'
    };
  }

  const options = {
    body: notificationData.body || 'New activity on Chirp!',
    icon: notificationData.icon || '/assets/community.svg',
    badge: notificationData.badge || '/assets/community.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: notificationData.id || Date.now().toString(),
      type: notificationData.type || 'general',
      ...notificationData.data
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/assets/search.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/assets/delete.svg'
      }
    ],
    tag: notificationData.tag || 'chirp-notification',
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Chirp', 
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  
  let urlToOpen = '/';
  
  // Determine the URL based on notification type
  switch (notificationData.type) {
    case 'like':
    case 'comment':
      if (notificationData.chirpId) {
        urlToOpen = `/chirp/${notificationData.chirpId}`;
      }
      break;
    case 'mention':
      if (notificationData.chirpId) {
        urlToOpen = `/chirp/${notificationData.chirpId}`;
      } else {
        urlToOpen = '/activity';
      }
      break;
    case 'follow':
    case 'follow-request':
      if (notificationData.userId) {
        urlToOpen = `/profile/${notificationData.userId}`;
      } else {
        urlToOpen = '/activity';
      }
      break;
    default:
      urlToOpen = '/';
  }

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification, no action needed
    return;
  } else {
    // Default action when clicking the notification body
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Perform background sync operations
  return Promise.resolve();
}