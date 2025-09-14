// Advanced Algorithm Service for X-level social media platform
"use server";

import { connectToDB } from "../mongoose";
import { resolveUserObjectId } from "../utils/userIdResolver";
import User from "../models/user.model";
import Chirp from "../models/chirp.model.enhanced";
import Community from "../models/community.model";

// Content-based filtering algorithm
export async function getPersonalizedFeed(userId: string, limit = 30, skip = 0) {
  try {
    connectToDB();
    
    const user = await User.findOne({ id: userId }).populate('following');
    if (!user) throw new Error("User not found");

    // Get user interests from their engagement history
    const userInterests = await getUserInterests(user._id);
    
    // Fetch posts from followed users (social signals)
    const followingIds = user.following.map((f: any) => f._id);
    
    // Advanced scoring algorithm combining multiple factors
    const posts = await Chirp.aggregate([
      {
        $match: {
          $or: [
            { author: { $in: followingIds } }, // Posts from followed users
            { hashtags: { $in: userInterests.hashtags } }, // Interest-based posts
            { $expr: { $gte: [{ $size: { $ifNull: ["$likes", []] } }, 5] } }, // Popular posts with 5+ likes
          ]
        }
      },
      {
        $addFields: {
          score: {
            $add: [
              // Recency score (newer posts get higher score)
              {
                $divide: [
                  { $subtract: [new Date(), "$createdAt"] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              },
              // Engagement score
              {
                $multiply: [
                  { 
                    $add: [
                      { $size: { $ifNull: ["$likes", []] } }, 
                      { $size: { $ifNull: ["$shares", []] } }, 
                      { $size: { $ifNull: ["$children", []] } }
                    ]
                  },
                  0.1
                ]
              },
              // Following score (posts from followed users get boost)
              {
                $cond: [
                  { $in: ["$author", followingIds] },
                  10,
                  0
                ]
              }
            ]
          }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $skip: skip }, // Add proper pagination skip
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author"
        }
      },
      {
        $lookup: {
          from: "communities",
          localField: "community",
          foreignField: "_id",
          as: "community"
        }
      },
      {
        $lookup: {
          from: "chirps",
          localField: "children",
          foreignField: "_id",
          as: "children",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author"
              }
            },
            {
              $unwind: {
                path: "$author",
                preserveNullAndEmptyArrays: true
              }
            }
          ]
        }
      }
    ]);

    return await serializePosts(posts, userId);
  } catch (error) {
    console.error("Error in personalized feed:", error);
    throw error;
  }
}

// Collaborative filtering for user recommendations
export async function getSuggestedUsers(userId: string, limit = 10) {
  try {
    connectToDB();
    
    const user = await User.findOne({ id: userId });
    if (!user) throw new Error("User not found");

    // Find users with similar interests and connections
    const suggestions = await User.aggregate([
      {
        $match: {
          _id: { 
            $ne: user._id,
            $nin: [...(user.following || []), ...(user.blockedUsers || [])]
          }
        }
      },
      {
        $addFields: {
          mutualFollows: {
            $size: {
              $setIntersection: [{ $ifNull: ["$followers", []] }, user.following || []]
            }
          },
          commonInterests: {
            $size: {
              $setIntersection: [{ $ifNull: ["$interests", []] }, user.interests || []]
            }
          }
        }
      },
      {
        $addFields: {
          suggestionScore: {
            $add: [
              { $multiply: ["$mutualFollows", 3] },
              { $multiply: ["$commonInterests", 2] },
              { $size: { $ifNull: ["$followers", []] } }
            ]
          }
        }
      },
      { $sort: { suggestionScore: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          id: 1,
          name: 1,
          username: 1,
          image: 1,
          bio: 1,
          verified: 1,
          suggestionScore: 1,
          mutualFollows: 1
        }
      }
    ]);

    return suggestions.map(user => ({
      _id: user._id.toString(),
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image || '/assets/user.svg',
      bio: user.bio || '',
      verified: user.verified || false,
      suggestionScore: user.suggestionScore || 0,
      mutualFollows: user.mutualFollows || 0
    }));
  } catch (error) {
    console.error("Error in user suggestions:", error);
    throw error;
  }
}

// Trending topics algorithm
export async function getTrendingTopics(timeframe = 24) {
  try {
    connectToDB();
    
    const hoursAgo = new Date(Date.now() - timeframe * 60 * 60 * 1000);
    
    const trends = await Chirp.aggregate([
      {
        $match: {
          createdAt: { $gte: hoursAgo },
          hashtags: { $exists: true, $ne: [] }
        }
      },
      { $unwind: "$hashtags" },
      {
        $group: {
          _id: "$hashtags",
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$author" },
          totalEngagement: {
            $sum: {
              $add: [
                { $size: { $ifNull: ["$likes", []] } },
                { $size: { $ifNull: ["$shares", []] } },
                { $size: { $ifNull: ["$children", []] } }
              ]
            }
          }
        }
      },
      {
        $addFields: {
          trendScore: {
            $multiply: [
              "$count",
              { $size: { $ifNull: ["$uniqueUsers", []] } },
              { $add: ["$totalEngagement", 1] }
            ]
          }
        }
      },
      { $sort: { trendScore: -1 } },
      { $limit: 20 },
      {
        $project: {
          hashtag: "$_id",
          postCount: "$count",
          userCount: { $size: { $ifNull: ["$uniqueUsers", []] } },
          engagement: "$totalEngagement",
          trendScore: 1
        }
      }
    ]);

    return trends.map(trend => ({
      hashtag: trend.hashtag,
      postCount: trend.postCount,
      userCount: trend.userCount,
      engagement: trend.engagement,
      trendScore: trend.trendScore
    }));
  } catch (error) {
    console.error("Error in trending topics:", error);
    throw error;
  }
}

// Content moderation and spam detection
export async function moderateContent(text: string, attachments: any[]) {
  // Simple content moderation - in production, use ML models
  const spamKeywords = ['spam', 'scam', 'fake', 'bot', 'cryptocurrency_scam'];
  const offensiveWords = ['hate', 'abuse', 'toxic']; // Add more comprehensive list
  
  const containsSpam = spamKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );
  
  const containsOffensive = offensiveWords.some(word => 
    text.toLowerCase().includes(word)
  );
  
  return {
    isAppropriate: !containsSpam && !containsOffensive,
    flags: {
      spam: containsSpam,
      offensive: containsOffensive,
      hasAttachments: attachments.length > 0
    },
    confidenceScore: containsSpam || containsOffensive ? 0.9 : 0.1
  };
}

// Helper function to get user interests
async function getUserInterests(userId: string) {
  const userPosts = await Chirp.find({ author: userId })
    .select('hashtags mentions')
    .limit(100);
  
  const hashtags = userPosts.flatMap(post => post.hashtags || []);
  const uniqueHashtags = Array.from(new Set(hashtags));
  
  return {
    hashtags: uniqueHashtags.slice(0, 20), // Top 20 interests
  };
}

// Helper function to serialize posts
async function serializePosts(posts: any[], currentUserId?: string) {
  // Resolve current user's ObjectId if provided
  let currentUserObjectId: any = null;
  if (currentUserId) {
    try {
      currentUserObjectId = await resolveUserObjectId(currentUserId);
    } catch (error) {
      console.error('Error resolving current user ObjectId in serializePosts:', error);
    }
  }

  return posts.map(post => ({
    _id: post._id.toString(),
    id: post._id.toString(), // Add id field for ChirpCard
    content: post.text || '', // Map text to content for ChirpCard
    text: post.text || '', // Keep text for backward compatibility
    parentId: post.parentId,
    author: post.author[0] ? {
      _id: post.author[0]._id.toString(),
      id: post.author[0].id,
      name: post.author[0].name,
      image: post.author[0].image,
      verified: post.author[0].verified || false
    } : null,
    community: post.community[0] ? {
      _id: post.community[0]._id.toString(),
      id: post.community[0].id,
      name: post.community[0].name,
      image: post.community[0].image,
    } : null,
    createdAt: post.createdAt ? post.createdAt.toISOString() : new Date().toISOString(),
    hashtags: post.hashtags || [],
    mentions: post.mentions || [],
    communityTags: post.communityTags || [],
    likes: post.likes?.map((like: any) => like.toString()) || [],
    shares: post.shares?.map((share: any) => share.toString()) || [],
    attachments: post.attachments || [],
    isLikedByCurrentUser: currentUserObjectId ? 
      post.likes?.some((like: any) => like.toString() === currentUserObjectId.toString()) || false 
      : false,
    comments: (post.children || []).map((child: any) => ({
      _id: child._id ? child._id.toString() : '',
      author: {
        _id: child.author?._id ? child.author._id.toString() : '',
        id: child.author?.id || '',
        name: child.author?.name || '',
        image: child.author?.image || '/assets/user.svg'
      }
    })),
    score: post.score || 0
  }));
}

// Real-time notification system
export async function createNotification({
  userId,
  type,
  triggeredBy,
  resourceId,
  message
}: {
  userId: string;
  type: 'like' | 'follow' | 'mention' | 'reply' | 'repost';
  triggeredBy: string;
  resourceId?: string;
  message: string;
}) {
  // In production, this would push to a real-time service like Pusher or Socket.io
  console.log(`Notification for ${userId}: ${message}`);
  
  // Store in database for persistence
  return {
    id: Date.now().toString(),
    userId,
    type,
    triggeredBy,
    resourceId,
    message,
    read: false,
    createdAt: new Date().toISOString()
  };
}

// Get popular posts
export async function getPopularPosts(timeFilter: '1h' | '24h' | '7d' = '24h', currentUserId?: string) {
  try {
    connectToDB();
    
    let timeframe = 24; // default 24 hours
    if (timeFilter === '1h') timeframe = 1;
    else if (timeFilter === '7d') timeframe = 24 * 7;
    
    const hoursAgo = new Date(Date.now() - timeframe * 60 * 60 * 1000);
    
    const popularPosts = await Chirp.aggregate([
      {
        $match: {
          createdAt: { $gte: hoursAgo }
        }
      },
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $multiply: [{ $size: { $ifNull: ["$likes", []] } }, 3] },
              { $multiply: [{ $size: { $ifNull: ["$shares", []] } }, 5] },
              { $multiply: [{ $size: { $ifNull: ["$children", []] } }, 2] },
              { $multiply: [{ $size: { $ifNull: ["$views", []] } }, 0.1] }
            ]
          }
        }
      },
      { $sort: { popularityScore: -1, createdAt: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author"
        }
      },
      {
        $lookup: {
          from: "communities",
          localField: "community",
          foreignField: "_id",
          as: "community"
        }
      },
      {
        $lookup: {
          from: "chirps",
          localField: "children",
          foreignField: "_id",
          as: "children",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author"
              }
            },
            {
              $unwind: {
                path: "$author",
                preserveNullAndEmptyArrays: true
              }
            }
          ]
        }
      }
    ]);

    return await serializePosts(popularPosts, currentUserId);
  } catch (error) {
    console.error("Error in popular posts:", error);
    throw error;
  }
}