import { fetchUser } from '@/lib/actions/user.actions';

/**
 * Trigger a like notification
 * This function runs on the server and sends notification data to the client
 */
export async function triggerLikeNotification(
  likedUserId: string,
  likerUserId: string,
  chirpText: string
) {
  try {
    // Don't notify if user likes their own post
    if (likedUserId === likerUserId) return;
    
    const liker = await fetchUser(likerUserId);
    if (!liker) return;

    // In a real production app, you would send this to a notification queue/service
    // For now, we'll store it in a way that can be picked up by the client
    const notificationPayload = {
      type: 'like' as const,
      recipientUserId: likedUserId,
      triggeredBy: {
        id: likerUserId,
        name: liker.name || liker.username,
      },
      content: {
        chirpText: chirpText.substring(0, 100),
      },
      timestamp: new Date().toISOString(),
    };

    // Log for development - in production this would go to a notification service
    console.log('Like notification triggered:', notificationPayload);
    
    // You could store this in a notifications collection in MongoDB
    // or send to a real-time service like Pusher, Socket.io, or Firebase
    return notificationPayload;
  } catch (error) {
    console.error('Error triggering like notification:', error);
  }
}

/**
 * Trigger a comment notification
 */
export async function triggerCommentNotification(
  originalAuthorId: string,
  commenterUserId: string,
  originalChirpText: string,
  commentText: string
) {
  try {
    // Don't notify if user comments on their own post
    if (originalAuthorId === commenterUserId) return;
    
    const commenter = await fetchUser(commenterUserId);
    if (!commenter) return;

    const notificationPayload = {
      type: 'comment' as const,
      recipientUserId: originalAuthorId,
      triggeredBy: {
        id: commenterUserId,
        name: commenter.name || commenter.username,
      },
      content: {
        originalChirpText: originalChirpText.substring(0, 50),
        commentText: commentText.substring(0, 100),
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Comment notification triggered:', notificationPayload);
    return notificationPayload;
  } catch (error) {
    console.error('Error triggering comment notification:', error);
  }
}

/**
 * Trigger mention notifications for all mentioned users in a chirp
 */
export async function triggerMentionNotifications(
  mentionedUserIds: string[],
  mentionerUserId: string,
  chirpText: string
) {
  try {
    const mentioner = await fetchUser(mentionerUserId);
    if (!mentioner) return;

    const notifications = [];

    // Send notification to each mentioned user
    for (const mentionedUserId of mentionedUserIds) {
      // Don't notify if user mentions themselves
      if (mentionedUserId === mentionerUserId) continue;

      try {
        const mentionedUser = await fetchUser(mentionedUserId);
        if (!mentionedUser) {
          console.log(
            `Mentioned user with ID ${mentionedUserId} not found. Skipping notification.`
          );
          continue;
        }
      } catch (error) {
        console.error(
          `Error fetching mentioned user ${mentionedUserId}:`,
          error
        );
        continue; // Skip if user fetch fails
      }

      const notificationPayload = {
        type: "mention" as const,
        recipientUserId: mentionedUserId,
        triggeredBy: {
          id: mentionerUserId,
          name: mentioner.name || mentioner.username,
        },
        content: {
          chirpText: chirpText.substring(0, 100),
        },
        timestamp: new Date().toISOString(),
      };

      console.log("Mention notification triggered:", notificationPayload);
      notifications.push(notificationPayload);
    }

    return notifications;
  } catch (error) {
    console.error('Error triggering mention notifications:', error);
  }
}

/**
 * Trigger a follow notification
 */
export async function triggerFollowNotification(
  followedUserId: string,
  followerUserId: string
) {
  try {
    // Don't notify if user follows themselves (shouldn't be possible)
    if (followedUserId === followerUserId) return;
    
    const follower = await fetchUser(followerUserId);
    if (!follower) return;

    const notificationPayload = {
      type: 'follow' as const,
      recipientUserId: followedUserId,
      triggeredBy: {
        id: followerUserId,
        name: follower.name || follower.username,
      },
      content: {},
      timestamp: new Date().toISOString(),
    };

    console.log('Follow notification triggered:', notificationPayload);
    return notificationPayload;
  } catch (error) {
    console.error('Error triggering follow notification:', error);
  }
}

/**
 * Trigger a follow request notification (for private accounts)
 */
export async function triggerFollowRequestNotification(
  targetUserId: string,
  requesterUserId: string
) {
  try {
    // Don't notify if user requests to follow themselves (shouldn't be possible)
    if (targetUserId === requesterUserId) return;
    
    const requester = await fetchUser(requesterUserId);
    if (!requester) return;

    const notificationPayload = {
      type: 'follow-request' as const,
      recipientUserId: targetUserId,
      triggeredBy: {
        id: requesterUserId,
        name: requester.name || requester.username,
      },
      content: {},
      timestamp: new Date().toISOString(),
    };

    console.log('Follow request notification triggered:', notificationPayload);
    return notificationPayload;
  } catch (error) {
    console.error('Error triggering follow request notification:', error);
  }
}

/**
 * Parse mentions from chirp text and return user IDs
 */
export async function extractMentionedUserIds(chirpText: string): Promise<string[]> {
  try {
    // Extract usernames from @mentions
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = Array.from(chirpText.matchAll(mentionRegex), match => match[1]);
    
    if (mentions.length === 0) return [];

    // Get user IDs for mentioned usernames
    const { getUsersByUsernames } = await import('@/lib/actions/mention.actions');
    const mentionedUsers = await getUsersByUsernames(mentions);
    
    return mentionedUsers.map(user => user._id.toString());
  } catch (error) {
    console.error('Error extracting mentioned user IDs:', error);
    return [];
  }
}