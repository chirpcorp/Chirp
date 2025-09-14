"use client";

interface NotificationSettings {
  likes: boolean;
  comments: boolean;
  followers: boolean;
  mentions: boolean;
  followRequests: boolean;
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

// Extend the NotificationOptions interface to include service worker specific options
interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Define missing types
type NotificationPermission = 'default' | 'denied' | 'granted';

interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: NotificationAction[];
}

// eslint-disable-next-line no-use-before-define
class NotificationService {
  // eslint-disable-next-line no-use-before-define
  private static instance: NotificationService;
  private settings: NotificationSettings = {
    likes: true,
    comments: true,
    followers: true,
    mentions: true,
    followRequests: true,
  };

  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {
    this.loadSettings();
    // Initialize service worker asynchronously without blocking constructor
    this.initializeServiceWorker().catch(error => {
      console.error('Failed to initialize service worker:', error);
    });
  }

  // eslint-disable-next-line no-use-before-define
  static getInstance(): NotificationService {
    // eslint-disable-next-line no-use-before-define
    if (!NotificationService.instance) {
      // eslint-disable-next-line no-use-before-define
      NotificationService.instance = new NotificationService();
    }
    // eslint-disable-next-line no-use-before-define
    return NotificationService.instance;
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        
        // If there's no active worker, wait for it to activate
        if (!this.serviceWorkerRegistration.active) {
          await new Promise((resolve) => {
            const checkActive = () => {
              if (this.serviceWorkerRegistration?.active) {
                resolve(undefined);
              } else {
                setTimeout(checkActive, 100);
              }
            };
            checkActive();
          });
        }
        
        console.log('Service Worker registered and activated successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        this.serviceWorkerRegistration = null;
      }
    }
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem('chirp-notification-settings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
  }

  private saveSettings() {
    localStorage.setItem('chirp-notification-settings', JSON.stringify(this.settings));
  }

  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  private isServiceWorkerReady(): boolean {
    return !!(this.serviceWorkerRegistration && 
             this.serviceWorkerRegistration.active && 
             this.serviceWorkerRegistration.active.state === 'activated');
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  getStatus() {
    return {
      permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
      serviceWorkerSupported: 'serviceWorker' in navigator,
      serviceWorkerRegistered: !!this.serviceWorkerRegistration,
      serviceWorkerActive: this.isServiceWorkerReady(),
      serviceWorkerState: this.serviceWorkerRegistration?.active?.state || 'unknown'
    };
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Ensure service worker is initialized and ready
      if (!this.serviceWorkerRegistration) {
        try {
          await this.initializeServiceWorker();
        } catch (error) {
          console.warn('Service Worker initialization failed, notifications will use direct mode:', error);
        }
      }
      console.log('Push notifications enabled');
    }

    return permission;
  }

  private async showNotification(payload: PushNotificationPayload) {
    if (Notification.permission !== 'granted') {
      return;
    }

    // Check if service worker is ready and has an active worker
    if (this.isServiceWorkerReady()) {
      try {
        // Use service worker to show notification with extended options
        const options: ExtendedNotificationOptions = {
          body: payload.body,
          icon: payload.icon || '/assets/community.svg',
          badge: payload.badge || '/assets/community.svg',
          tag: payload.tag,
          data: payload.data,
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
          ]
        };
        await this.serviceWorkerRegistration!.showNotification(payload.title, options);
      } catch (error) {
        console.error('Service Worker notification failed, falling back to direct notification:', error);
        // Fallback to direct notification
        // eslint-disable-next-line no-new
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/assets/community.svg',
        });
      }
    } else {
      // Fallback to direct notification when service worker isn't available
      console.log('Service Worker not ready, using direct notification');
      // eslint-disable-next-line no-new
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/assets/community.svg',
      });
    }
  }

  // Notification methods for different types of interactions
  async notifyLike(likerName: string, chirpText: string) {
    if (!this.settings.likes) return;

    await this.showNotification({
      title: 'New Like ❤️',
      body: `${likerName} liked your chirp: "${chirpText.substring(0, 50)}${chirpText.length > 50 ? '...' : ''}"`,
      tag: 'like',
      data: { type: 'like', likerName }
    });
  }

  async notifyComment(commenterName: string, chirpText: string, commentText: string) {
    if (!this.settings.comments) return;

    await this.showNotification({
      title: 'New Comment 💬',
      body: `${commenterName} commented on your chirp: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
      tag: 'comment',
      data: { type: 'comment', commenterName, originalChirp: chirpText }
    });
  }

  async notifyMention(mentionerName: string, chirpText: string) {
    if (!this.settings.mentions) return;

    await this.showNotification({
      title: 'You were mentioned! 🏷️',
      body: `${mentionerName} mentioned you: "${chirpText.substring(0, 50)}${chirpText.length > 50 ? '...' : ''}"`,
      tag: 'mention',
      data: { type: 'mention', mentionerName }
    });
  }

  async notifyFollow(followerName: string) {
    if (!this.settings.followers) return;

    await this.showNotification({
      title: 'New Follower 👥',
      body: `${followerName} started following you!`,
      tag: 'follow',
      data: { type: 'follow', followerName }
    });
  }

  async notifyFollowRequest(requesterName: string) {
    if (!this.settings.followRequests) return;

    await this.showNotification({
      title: 'Follow Request 📩',
      body: `${requesterName} wants to follow you`,
      tag: 'follow-request',
      data: { type: 'follow-request', requesterName }
    });
  }

  // Test notification
  async sendTestNotification() {
    await this.showNotification({
      title: 'Test Notification 🔔',
      body: 'This is a test notification from Chirp!',
      tag: 'test'
    });
  }
}

export default NotificationService;