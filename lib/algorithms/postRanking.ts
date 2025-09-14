"use server";

import { connectToDB } from "../mongoose";
import { resolveUserObjectId } from "../utils/userIdResolver";
import User from "../models/user.model";
import Chirp from "../models/chirp.model.enhanced";

/**
 * Advanced Post Ranking Algorithm
 * Factors considered:
 * 1. Recency (time decay)
 * 2. Engagement (likes, comments, shares)
 * 3. User interaction patterns
 * 4. Content quality signals
 */
export async function getSmartFeed(userId: string, limit = 20, skip = 0) {
  try {
    connectToDB();

    // Get user's following list for personalization
    const user = await User.findOne({ id: userId }).populate('following');
    if (!user) throw new Error("User not found");

    const followingIds = user.following?.map((f: any) => f._id) || [];
    const currentTime = new Date();

    const posts = await Chirp.aggregate([
      {
        $match: {
          parentId: { $in: [null, undefined] } // Top-level posts only
        }
      },
      {
        $addFields: {
          // Calculate engagement score
          engagementScore: {
            $add: [
              { $multiply: [{ $size: { $ifNull: ["$likes", []] } }, 3] }, // Likes worth 3 points
              { $multiply: [{ $size: { $ifNull: ["$children", []] } }, 5] }, // Comments worth 5 points
              { $multiply: [{ $size: { $ifNull: ["$shares", []] } }, 4] }, // Shares worth 4 points
              { $multiply: [{ $size: { $ifNull: ["$views", []] } }, 0.1] } // Views worth 0.1 points
            ]
          },
          
          // Calculate recency score (higher for newer posts)
          recencyScore: {
            $divide: [
              86400000, // 24 hours in milliseconds
              {
                $add: [
                  { $subtract: [currentTime, "$createdAt"] },
                  3600000 // Add 1 hour to prevent division by zero
                ]
              }
            ]
          },
          
          // Boost score for posts from followed users
          followingBoost: {
            $cond: [
              { $in: ["$author", followingIds] },
              10, // Boost posts from followed users
              0
            ]
          },
          
          // Calculate viral potential (engagement rate relative to time)
          viralScore: {
            $cond: [
              { $gt: [{ $subtract: [currentTime, "$createdAt"] }, 0] },
              {
                $divide: [
                  {
                    $add: [
                      { $size: { $ifNull: ["$likes", []] } },
                      { $size: { $ifNull: ["$children", []] } },
                      { $size: { $ifNull: ["$shares", []] } }
                    ]
                  },
                  {
                    $add: [
                      { 
                        $divide: [
                          { $subtract: [currentTime, "$createdAt"] },
                          3600000 // Convert to hours
                        ]
                      },
                      1 // Prevent division by zero
                    ]
                  }
                ]
              },
              0
            ]
          }
        }
      },
      {
        $addFields: {
          // Final ranking score combining all factors
          finalScore: {
            $add: [
              { $multiply: ["$engagementScore", 0.4] }, // 40% engagement
              { $multiply: ["$recencyScore", 0.3] },     // 30% recency
              { $multiply: ["$followingBoost", 0.2] },   // 20% following boost
              { $multiply: ["$viralScore", 0.1] }        // 10% viral potential
            ]
          }
        }
      },
      { $sort: { finalScore: -1, createdAt: -1 } },
      { $skip: skip },
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
            { $limit: 3 }, // Limit to 3 comments to prevent deep nesting
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

    return await serializeSmartPosts(posts, userId);
  } catch (error) {
    console.error("Error in smart feed algorithm:", error);
    // Fallback to simple chronological order
    return await getChronologicalFeed(userId, limit, skip);
  }
}

async function serializeSmartPosts(posts: any[], currentUserId: string) {
  let currentUserObjectId: any = null;
  if (currentUserId) {
    try {
      currentUserObjectId = await resolveUserObjectId(currentUserId);
    } catch (error) {
      console.error('Error resolving current user ObjectId:', error);
    }
  }

  return posts.map(post => {
    // Convert to plain object to remove MongoDB internal properties
    const plainPost = post.toObject ? post.toObject() : post;
    
    return {
      _id: plainPost._id.toString(),
      id: plainPost._id.toString(),
      content: plainPost.text || '',
      text: plainPost.text || '',
      parentId: plainPost.parentId,
      author: plainPost.author && plainPost.author[0] ? {
        _id: plainPost.author[0]._id.toString(),
        id: plainPost.author[0].id,
        name: plainPost.author[0].name,
        image: plainPost.author[0].image,
        verified: plainPost.author[0].verified || false
      } : null,
      community: plainPost.community && plainPost.community[0] ? {
        _id: plainPost.community[0]._id.toString(),
        id: plainPost.community[0].id,
        name: plainPost.community[0].name,
        image: plainPost.community[0].image,
      } : null,
      createdAt: plainPost.createdAt ? plainPost.createdAt.toISOString() : new Date().toISOString(),
      hashtags: plainPost.hashtags || [],
      mentions: plainPost.mentions || [],
      communityTags: plainPost.communityTags || [],
      likes: plainPost.likes?.map((like: any) => like.toString()) || [],
      shares: plainPost.shares?.map((share: any) => share.toString()) || [],
      attachments: plainPost.attachments || [],
      isLikedByCurrentUser: currentUserObjectId ? 
        plainPost.likes?.some((like: any) => like.toString() === currentUserObjectId.toString()) || false 
        : false,
      comments: Array.isArray(plainPost.children) ? plainPost.children.slice(0, 3).map((child: any) => {
        // Convert child to plain object
        const plainChild = child.toObject ? child.toObject() : child;
        return {
          _id: plainChild._id ? plainChild._id.toString() : '',
          author: {
            _id: plainChild.author?._id ? plainChild.author._id.toString() : '',
            id: plainChild.author?.id || '',
            name: plainChild.author?.name || '',
            image: plainChild.author?.image || '/assets/user.svg'
          }
        };
      }) : [],
      // Include algorithm scores for debugging (can be removed in production)
      algorithmData: {
        engagementScore: plainPost.engagementScore,
        recencyScore: plainPost.recencyScore,
        finalScore: plainPost.finalScore
      }
    };
  });
}

// Fallback chronological feed
async function getChronologicalFeed(userId: string, limit: number, skip: number) {
  const posts = await Chirp.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author')
    .populate('community')
    .populate({
      path: 'children',
      options: { limit: 3 }, // Limit to 3 comments
      populate: { path: 'author' }
    });

  // Convert Mongoose documents to plain objects before serialization
  const plainPosts = posts.map(post => post.toObject ? post.toObject() : post);
  return await serializeSmartPosts(plainPosts, userId);
}
