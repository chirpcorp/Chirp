// Advanced Analytics and Metrics System
"use server";

import { connectToDB } from "../mongoose";
import User from "../models/user.model";
import Chirp from "../models/chirp.model.enhanced";
import Community from "../models/community.model";

// Real-time engagement metrics
export async function getChirpAnalytics(chirpId: string) {
  try {
    connectToDB();
    
    const chirp = await Chirp.findById(chirpId);
    if (!chirp) throw new Error("Chirp not found");

    const analytics = await Chirp.aggregate([
      { $match: { _id: chirp._id } },
      {
        $addFields: {
          totalEngagement: {
            $add: [
              { $size: { $ifNull: ["$likes", []] } },
              { $size: { $ifNull: ["$shares", []] } },
              { $size: { $ifNull: ["$children", []] } }
            ]
          },
          engagementRate: {
            $divide: [
              {
                $add: [
                  { $size: { $ifNull: ["$likes", []] } },
                  { $size: { $ifNull: ["$shares", []] } },
                  { $size: { $ifNull: ["$children", []] } }
                ]
              },
              { $max: [{ $size: { $ifNull: ["$impressions", []] } }, 1] } // Avoid division by zero
            ]
          }
        }
      }
    ]);

    return analytics[0] || null;
  } catch (error) {
    console.error("Error in chirp analytics:", error);
    throw error;
  }
}

// User growth and engagement metrics
export async function getUserMetrics(userId: string, days = 30) {
  try {
    connectToDB();
    
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const metrics = await User.aggregate([
      { $match: { id: userId } },
      {
        $lookup: {
          from: "chirps",
          localField: "_id",
          foreignField: "author",
          as: "userChirps"
        }
      },
      {
        $addFields: {
          recentChirps: {
            $filter: {
              input: "$userChirps",
              cond: { $gte: ["$$this.createdAt", daysAgo] }
            }
          }
        }
      },
      {
        $addFields: {
          totalPosts: { $size: { $ifNull: ["$recentChirps", []] } },
          totalLikes: {
            $sum: {
              $map: {
                input: { $ifNull: ["$recentChirps", []] },
                as: "chirp",
                in: { $size: { $ifNull: ["$$chirp.likes", []] } }
              }
            }
          },
          totalShares: {
            $sum: {
              $map: {
                input: { $ifNull: ["$recentChirps", []] },
                as: "chirp",
                in: { $size: { $ifNull: ["$$chirp.shares", []] } }
              }
            }
          },
          followersGrowth: { $size: { $ifNull: ["$followers", []] } },
          engagementScore: {
            $divide: [
              {
                $add: [
                  {
                    $sum: {
                      $map: {
                        input: { $ifNull: ["$recentChirps", []] },
                        as: "chirp",
                        in: { $size: { $ifNull: ["$$chirp.likes", []] } }
                      }
                    }
                  },
                  {
                    $sum: {
                      $map: {
                        input: { $ifNull: ["$recentChirps", []] },
                        as: "chirp",
                        in: { $size: { $ifNull: ["$$chirp.shares", []] } }
                      }
                    }
                  }
                ]
              },
              { $max: [{ $size: { $ifNull: ["$recentChirps", []] } }, 1] }
            ]
          }
        }
      },
      {
        $project: {
          totalPosts: 1,
          totalLikes: 1,
          totalShares: 1,
          followersGrowth: 1,
          engagementScore: 1,
          avgEngagementPerPost: {
            $divide: [
              { $add: ["$totalLikes", "$totalShares"] },
              { $max: ["$totalPosts", 1] }
            ]
          }
        }
      }
    ]);

    return metrics[0] || {
      totalPosts: 0,
      totalLikes: 0,
      totalShares: 0,
      followersGrowth: 0,
      engagementScore: 0,
      avgEngagementPerPost: 0
    };
  } catch (error) {
    console.error("Error in user metrics:", error);
    throw error;
  }
}

// Platform-wide analytics
export async function getPlatformMetrics() {
  try {
    connectToDB();
    
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [dailyStats, weeklyStats, totalUsers, totalChirps, totalCommunities] = await Promise.all([
      // Daily active users and posts
      Chirp.aggregate([
        { $match: { createdAt: { $gte: yesterday } } },
        {
          $group: {
            _id: null,
            dailyPosts: { $sum: 1 },
            activeUsers: { $addToSet: "$author" }
          }
        },
        {
          $addFields: {
            dailyActiveUsers: { $size: { $ifNull: ["$activeUsers", []] } }
          }
        }
      ]),
      
      // Weekly stats
      Chirp.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: null,
            weeklyPosts: { $sum: 1 },
            activeUsers: { $addToSet: "$author" }
          }
        },
        {
          $addFields: {
            weeklyActiveUsers: { $size: { $ifNull: ["$activeUsers", []] } }
          }
        }
      ]),
      
      User.countDocuments(),
      Chirp.countDocuments(),
      Community.countDocuments()
    ]);

    return {
      totalUsers,
      totalChirps,
      totalCommunities,
      dailyActiveUsers: dailyStats[0]?.dailyActiveUsers || 0,
      dailyPosts: dailyStats[0]?.dailyPosts || 0,
      weeklyActiveUsers: weeklyStats[0]?.weeklyActiveUsers || 0,
      weeklyPosts: weeklyStats[0]?.weeklyPosts || 0,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error in platform metrics:", error);
    throw error;
  }
}
