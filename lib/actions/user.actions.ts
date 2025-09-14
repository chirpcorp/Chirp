"use server";

import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";
import { resolveUserObjectId } from "../utils/userIdResolver";
import { 
  triggerFollowNotification,
  triggerFollowRequestNotification 
} from "../notifications/triggers";

import Community from "../models/community.model";
import Chirp from "../models/chirp.model.enhanced";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";

export async function fetchUser(userId: string) {
  try {
    await connectToDB();

    const user = await User.findOne({ id: userId }).populate({
      path: "communities",
      model: Community,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Serialize to plain object to avoid circular references
    return {
      _id: user._id?.toString() || '',
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      bio: user.bio,
      email: user.email,
      website: user.website,
      location: user.location,
      dateOfBirth: user.dateOfBirth?.toISOString(),
      joinedDate: user.joinedDate?.toISOString(),
      followers: user.followers?.map((follower: any) => follower.toString()) || [],
      following: user.following?.map((following: any) => following.toString()) || [],
      followRequests: user.followRequests?.map((request: any) => ({
        user: request.user.toString(),
        requestedAt: request.requestedAt?.toISOString(),
      })) || [],
      sentFollowRequests: user.sentFollowRequests?.map((request: any) => ({
        user: request.user.toString(),
        requestedAt: request.requestedAt?.toISOString(),
      })) || [],
      blockedUsers: user.blockedUsers?.map((blocked: any) => blocked.toString()) || [],
      reportedUsers: user.reportedUsers?.map((report: any) => ({
        userId: report.userId.toString(),
        reason: report.reason,
        date: report.date?.toISOString(),
      })) || [],
      isPrivate: user.isPrivate || false,
      chirps: user.chirps?.map((chirp: any) => chirp.toString()) || [],
      onboarded: user.onboarded || false,
      communities: user.communities?.map((community: any) => ({
        _id: community._id?.toString() || '',
        id: community.id,
        name: community.name,
        image: community.image,
      })) || [],
    };
  } catch (error: any) {
    console.error("Error fetching user:", error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
  email?: string;
  website?: string;
  location?: string;
  dateOfBirth?: string;
}

export async function updateUser({
  userId,
  bio,
  name,
  path,
  username,
  image,
  email,
  website,
  location,
  dateOfBirth,
}: Params): Promise<void> {
  try {
    connectToDB();

    const updateData: any = {
      username: username.toLowerCase(),
      name,
      bio,
      image,
      onboarded: true,
    };

    if (email) updateData.email = email;
    if (website) updateData.website = website;
    if (location) updateData.location = location;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);

    await User.findOneAndUpdate(
      { id: userId },
      updateData,
      { upsert: true }
    );

    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string, currentUserId?: string) {
  try {
    // Add safety check
    if (!userId) {
      return { chirps: [], name: '', image: '', id: '' };
    }
    
    connectToDB();

    // Resolve current user's ObjectId if provided
    let currentUserObjectId: any = null;
    if (currentUserId) {
      try {
        currentUserObjectId = await resolveUserObjectId(currentUserId);
      } catch (error) {
        console.error('Error resolving current user ObjectId:', error);
      }
    }

    // Find all chirps authored by the user with the given userId
    const chirps = await User.findOne({ id: userId }).populate({
      path: "chirps",
      model: Chirp,
      populate: [
        {
          path: "author",
          model: User,
          select: "name id image _id", // Ensure author is populated
        },
        {
          path: "community",
          model: Community,
          select: "name id image _id", // Select the "name" and "_id" fields from the "Community" model
        },
        {
          path: "children",
          model: Chirp,
          populate: {
            path: "author",
            model: User,
            select: "name image id", // Select the "name" and "_id" fields from the "User" model
          },
        },
      ],
    });
    
    // Handle case where user has no chirps or user not found
    if (!chirps) {
      return { chirps: [], name: '', image: '', id: '' };
    }
    
    // Serialize the chirps to plain objects
    const serializedChirps = chirps.chirps.map((chirp: any) => ({
      _id: chirp._id.toString(),
      text: chirp.text,
      parentId: chirp.parentId,
      author: {
        _id: chirp.author._id.toString(),
        id: chirp.author.id,
        name: chirp.author.name,
        image: chirp.author.image,
      },
      community: chirp.community ? {
        _id: chirp.community._id.toString(),
        id: chirp.community.id,
        name: chirp.community.name,
        image: chirp.community.image,
      } : null,
      createdAt: chirp.createdAt.toISOString(),
      children: chirp.children.map((child: any) => ({
        _id: child._id.toString(),
        author: {
          image: child.author?.image || '/assets/user.svg',
        },
      })),
      hashtags: chirp.hashtags || [],
      mentions: chirp.mentions?.map((mention: any) => ({ userId: mention.userId.toString(), username: mention.username })) || [],
      communityTags: chirp.communityTags || [],
      likes: chirp.likes?.map((like: any) => like.toString()) || [],
      shares: chirp.shares?.map((share: any) => share.toString()) || [],
      attachments: chirp.attachments || [],
      isLikedByCurrentUser: currentUserObjectId ? 
        chirp.likes?.some((like: any) => like.toString() === currentUserObjectId.toString()) || false 
        : false,
    }));
    
    return {
      chirps: serializedChirps,
      name: chirps.name,
      image: chirps.image,
      id: chirps.id,
    };
  } catch (error) {
    console.error("Error fetching user chirps:", error);
    // Return empty data instead of throwing an error
    return { chirps: [], name: '', image: '', id: '' };
  }
}

// New function to fetch user replies
export async function fetchUserReplies(userId: string, currentUserId?: string) {
  try {
    // Add safety check
    if (!userId) {
      return { chirps: [] };
    }
    
    connectToDB();

    // Resolve current user's ObjectId if provided
    let currentUserObjectId: any = null;
    if (currentUserId) {
      try {
        currentUserObjectId = await resolveUserObjectId(currentUserId);
      } catch (error) {
        console.error('Error resolving current user ObjectId:', error);
      }
    }

    // First find the user's MongoDB ObjectId using their Clerk ID
    const user = await User.findOne({ id: userId });
    if (!user) {
      return { chirps: [] };
    }

    // Find all chirps where the user is the author and parentId is not null (meaning it's a reply)
    const replies = await Chirp.find({ 
      author: user._id, // Use MongoDB ObjectId instead of Clerk ID
      parentId: { $ne: null } 
    })
    .populate({
      path: "author",
      model: User,
      select: "name image id",
    })
    .populate({
      path: "community",
      model: Community,
      select: "name id image _id",
    })
    .populate({
      path: "children",
      model: Chirp,
      populate: {
        path: "author",
        model: User,
        select: "name image id",
      },
    })
    .sort({ createdAt: "desc" });

    // Serialize the replies to plain objects
    const serializedReplies = replies.map((reply: any) => ({
      _id: reply._id.toString(),
      text: reply.text,
      parentId: reply.parentId,
      author: {
        _id: reply.author._id.toString(),
        id: reply.author.id,
        name: reply.author.name,
        image: reply.author.image,
      },
      community: reply.community ? {
        _id: reply.community._id.toString(),
        id: reply.community.id,
        name: reply.community.name,
        image: reply.community.image,
      } : null,
      createdAt: reply.createdAt.toISOString(),
      children: reply.children.map((child: any) => ({
        _id: child._id.toString(),
        author: {
          image: child.author?.image || '/assets/user.svg',
        },
      })),
      hashtags: reply.hashtags || [],
      mentions: reply.mentions?.map((mention: any) => ({ userId: mention.userId.toString(), username: mention.username })) || [],
      communityTags: reply.communityTags || [],
      likes: reply.likes?.map((like: any) => like.toString()) || [],
      shares: reply.shares?.map((share: any) => share.toString()) || [],
      attachments: reply.attachments || [],
      isLikedByCurrentUser: currentUserObjectId ? 
        reply.likes?.some((like: any) => like.toString() === currentUserObjectId.toString()) || false 
        : false,
    }));

    return { chirps: serializedReplies };
  } catch (error) {
    console.error("Error fetching user replies:", error);
    // Return empty data instead of throwing an error
    return { chirps: [] };
  }
}

// Almost similar to Thead (search + pagination) and Community (search + pagination)
export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    await connectToDB();

    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter users.
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // Exclude the current user from the results.
    };

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched users based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    // Count the total number of users that match the search criteria (without pagination).
    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    // Check if there are more users beyond the current page.
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function getActivity(userId: string) {
  try {
    await connectToDB();

    // Find all chirps created by the user
    const userChirps = await Chirp.find({ author: userId });

    // Collect all the child chirp ids (replies) from the 'children' field of each user chirp
    const childChirpIds = userChirps.reduce((acc, userChirp) => {
      return acc.concat(userChirp.children);
    }, []);

    // Find and return the child chirps (replies) excluding the ones created by the same user
    const replies = await Chirp.find({
      _id: { $in: childChirpIds },
      author: { $ne: userId }, // Exclude chirps authored by the same user
    }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    return replies;
  } catch (error) {
    console.error("Error fetching replies: ", error);
    throw error;
  }
}

// Follow/Unfollow functionality with follow request support
export async function followUser(currentUserId: string, targetUserId: string, path: string) {
  try {
    await connectToDB();

    const currentUser = await User.findOne({ id: currentUserId });
    const targetUser = await User.findOne({ id: targetUserId });

    if (!currentUser || !targetUser) {
      throw new Error("User not found");
    }

    const isFollowing = currentUser.following.includes(targetUser._id);
    const hasPendingRequest = currentUser.sentFollowRequests.some(
      (request: any) => request.user.toString() === targetUser._id.toString()
    );

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { following: targetUser._id }
      });
      await User.findByIdAndUpdate(targetUser._id, {
        $pull: { followers: currentUser._id }
      });
      
      revalidatePath(path);
      return { status: 'unfollowed', isFollowing: false };
    } else if (hasPendingRequest) {
      // Cancel follow request
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { sentFollowRequests: { user: targetUser._id } }
      });
      await User.findByIdAndUpdate(targetUser._id, {
        $pull: { followRequests: { user: currentUser._id } }
      });
      
      revalidatePath(path);
      return { status: 'request_cancelled', isFollowing: false };
    } else {
      // Follow or send follow request
      if (targetUser.isPrivate) {
        // Send follow request for private account
        await User.findByIdAndUpdate(currentUser._id, {
          $push: { 
            sentFollowRequests: { 
              user: targetUser._id,
              requestedAt: new Date()
            }
          }
        });
        await User.findByIdAndUpdate(targetUser._id, {
          $push: { 
            followRequests: { 
              user: currentUser._id,
              requestedAt: new Date()
            }
          }
        });
        
        // Trigger follow request notification
        triggerFollowRequestNotification(targetUserId, currentUserId).catch(error => {
          console.error('Failed to send follow request notification:', error);
        });
        
        revalidatePath(path);
        return { status: 'request_sent', isFollowing: false };
      } else {
        // Follow public account directly
        await User.findByIdAndUpdate(currentUser._id, {
          $push: { following: targetUser._id }
        });
        await User.findByIdAndUpdate(targetUser._id, {
          $push: { followers: currentUser._id }
        });
        
        // Trigger follow notification
        triggerFollowNotification(targetUserId, currentUserId).catch(error => {
          console.error('Failed to send follow notification:', error);
        });
        
        revalidatePath(path);
        return { status: 'following', isFollowing: true };
      }
    }
  } catch (error: any) {
    throw new Error(`Failed to follow/unfollow user: ${error.message}`);
  }
}

// Block functionality
export async function blockUser(currentUserId: string, targetUserId: string, path: string) {
  try {
    await connectToDB();

    const currentUser = await User.findOne({ id: currentUserId });
    const targetUser = await User.findOne({ id: targetUserId });

    if (!currentUser || !targetUser) {
      throw new Error("User not found");
    }

    const isBlocked = currentUser.blockedUsers.includes(targetUser._id);

    if (isBlocked) {
      // Unblock
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { blockedUsers: targetUser._id }
      });
    } else {
      // Block - also remove from following/followers
      await User.findByIdAndUpdate(currentUser._id, {
        $push: { blockedUsers: targetUser._id },
        $pull: { following: targetUser._id }
      });
      await User.findByIdAndUpdate(targetUser._id, {
        $pull: { 
          followers: currentUser._id,
          following: currentUser._id 
        }
      });
    }

    revalidatePath(path);
    return !isBlocked; // Return new block status
  } catch (error: any) {
    throw new Error(`Failed to block/unblock user: ${error.message}`);
  }
}

// Report functionality
export async function reportUser(
  currentUserId: string, 
  targetUserId: string, 
  reason: string, 
  path: string
) {
  try {
    await connectToDB();

    const currentUser = await User.findOne({ id: currentUserId });
    const targetUser = await User.findOne({ id: targetUserId });

    if (!currentUser || !targetUser) {
      throw new Error("User not found");
    }

    // Add report to current user's reportedUsers array
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { 
        reportedUsers: {
          userId: targetUser._id,
          reason,
          date: new Date()
        }
      }
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to report user: ${error.message}`);
  }
}

// Fetch user followers
export async function fetchUserFollowers(userId: string) {
  try {
    await connectToDB();

    const user = await User.findOne({ id: userId })
      .populate({
        path: 'followers',
        model: User,
        select: '_id id name username image'
      });
    
    if (!user) {
      throw new Error("User not found");
    }

    // Serialize the followers
    const serializedFollowers = user.followers.map((follower: any) => ({
      _id: follower._id.toString(),
      id: follower.id,
      name: follower.name,
      username: follower.username,
      image: follower.image,
    }));

    return serializedFollowers;
  } catch (error: any) {
    throw new Error(`Failed to fetch followers: ${error.message}`);
  }
}

// Fetch user following
export async function fetchUserFollowing(userId: string) {
  try {
    await connectToDB();

    const user = await User.findOne({ id: userId })
      .populate({
        path: 'following',
        model: User,
        select: '_id id name username image'
      });
    
    if (!user) {
      throw new Error("User not found");
    }

    // Serialize the following
    const serializedFollowing = user.following.map((followedUser: any) => ({
      _id: followedUser._id.toString(),
      id: followedUser.id,
      name: followedUser.name,
      username: followedUser.username,
      image: followedUser.image,
    }));

    return serializedFollowing;
  } catch (error: any) {
    throw new Error(`Failed to fetch following: ${error.message}`);
  }
}

// Get user relationship status
export async function getUserRelationship(currentUserId: string, targetUserId: string) {
  try {
    await connectToDB();

    // Add safety checks
    if (!currentUserId || !targetUserId) {
      return {
        isFollowing: false,
        isBlocked: false,
        isReported: false,
        hasPendingRequest: false,
        hasIncomingRequest: false,
        followersCount: 0,
        followingCount: 0
      };
    }

    const currentUser = await User.findOne({ id: currentUserId });
    const targetUser = await User.findOne({ id: targetUserId });

    if (!currentUser || !targetUser) {
      return {
        isFollowing: false,
        isBlocked: false,
        isReported: false,
        hasPendingRequest: false,
        hasIncomingRequest: false,
        followersCount: 0,
        followingCount: 0
      };
    }

    const isFollowing = currentUser.following.includes(targetUser._id);
    const isBlocked = currentUser.blockedUsers.includes(targetUser._id);
    const isReported = currentUser.reportedUsers.some(
      (report: any) => report.userId.toString() === targetUser._id.toString()
    );
    const hasPendingRequest = currentUser.sentFollowRequests?.some(
      (request: any) => request.user.toString() === targetUser._id.toString()
    ) || false;
    const hasIncomingRequest = targetUser.followRequests?.some(
      (request: any) => request.user.toString() === currentUser._id.toString()
    ) || false;

    return {
      isFollowing,
      isBlocked,
      isReported,
      hasPendingRequest,
      hasIncomingRequest,
      followersCount: targetUser.followers.length,
      followingCount: targetUser.following.length
    };
  } catch (error: any) {
    console.error("Error getting user relationship:", error);
    // Return default values instead of throwing an error
    return {
      isFollowing: false,
      isBlocked: false,
      isReported: false,
      hasPendingRequest: false,
      hasIncomingRequest: false,
      followersCount: 0,
      followingCount: 0
    };
  }
}

// Update user privacy settings
export async function updateUserPrivacy(userId: string, isPrivate: boolean) {
  try {
    await connectToDB();

    await User.findOneAndUpdate(
      { id: userId },
      { isPrivate },
      { new: true }
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update privacy settings: ${error.message}`);
  }
}

// Accept follow request
export async function acceptFollowRequest(currentUserId: string, requesterUserId: string, path: string) {
  try {
    await connectToDB();

    const currentUser = await User.findOne({ id: currentUserId });
    const requesterUser = await User.findOne({ id: requesterUserId });

    if (!currentUser || !requesterUser) {
      throw new Error("User not found");
    }

    // Remove from follow requests
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { followRequests: { user: requesterUser._id } }
    });
    await User.findByIdAndUpdate(requesterUser._id, {
      $pull: { sentFollowRequests: { user: currentUser._id } }
    });

    // Add to followers/following
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { followers: requesterUser._id }
    });
    await User.findByIdAndUpdate(requesterUser._id, {
      $push: { following: currentUser._id }
    });

    revalidatePath(path);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to accept follow request: ${error.message}`);
  }
}

// Reject follow request
export async function rejectFollowRequest(currentUserId: string, requesterUserId: string, path: string) {
  try {
    await connectToDB();

    const currentUser = await User.findOne({ id: currentUserId });
    const requesterUser = await User.findOne({ id: requesterUserId });

    if (!currentUser || !requesterUser) {
      throw new Error("User not found");
    }

    // Remove from follow requests
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { followRequests: { user: requesterUser._id } }
    });
    await User.findByIdAndUpdate(requesterUser._id, {
      $pull: { sentFollowRequests: { user: currentUser._id } }
    });

    revalidatePath(path);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to reject follow request: ${error.message}`);
  }
}

// Get user's follow requests
export async function getFollowRequests(userId: string) {
  try {
    await connectToDB();

    const user = await User.findOne({ id: userId })
      .populate({
        path: 'followRequests.user',
        model: User,
        select: '_id id name username image'
      });
    
    if (!user) {
      throw new Error("User not found");
    }

    // Serialize the follow requests
    const serializedRequests = user.followRequests?.map((request: any) => ({
      _id: request._id.toString(),
      user: {
        _id: request.user._id.toString(),
        id: request.user.id,
        name: request.user.name,
        username: request.user.username,
        image: request.user.image,
      },
      requestedAt: request.requestedAt.toISOString(),
    })) || [];

    return serializedRequests;
  } catch (error: any) {
    throw new Error(`Failed to get follow requests: ${error.message}`);
  }
}
