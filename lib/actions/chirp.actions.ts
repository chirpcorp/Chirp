"use server";

import { revalidatePath } from "next/cache";

import { connectToDB } from "../mongoose";
import { resolveUserObjectId } from "../utils/userIdResolver";
import { 
  triggerMentionNotifications, 
  extractMentionedUserIds,
  triggerCommentNotification,
  triggerLikeNotification 
} from "../notifications/triggers";

import User from "../models/user.model";
import Chirp from "../models/chirp.model.enhanced";
import Community from "../models/community.model";

export async function fetchPosts(pageNumber = 1, pageSize = 20, currentUserId?: string) {
  await connectToDB();

  // Calculate the number of posts to skip based on the page number and page size.
  const skipAmount = (pageNumber - 1) * pageSize;

  // Resolve current user's ObjectId if provided
  let currentUserObjectId: any = null;
  if (currentUserId) {
    try {
      currentUserObjectId = await resolveUserObjectId(currentUserId);
    } catch (error) {
      console.error('Error resolving current user ObjectId:', error);
    }
  }

  // Create a query to fetch the posts that have no parent (top-level chirps) (a chirp that is not a comment/reply).
  const postsQuery = Chirp.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: "author",
      model: User,
    })
    .populate({
      path: "community",
      model: Community,
    })
    .populate({
      path: "children", // Populate the children field
      populate: {
        path: "author", // Populate the author field within children
        model: User,
        select: "_id name parentId image", // Select only _id and username fields of the author
      },
    });

  // Count the total number of top-level posts (chirps) i.e., chirps that are not comments.
  const totalPostsCount = await Chirp.countDocuments({
    parentId: { $in: [null, undefined] },
  }); // Get the total count of posts

  const posts = await postsQuery.exec();

  const isNext = totalPostsCount > skipAmount + posts.length;

  // Serialize the posts to plain objects
  const serializedPosts = posts.map(post => ({
    _id: post._id?.toString() || '',
    text: post.text,
    parentId: post.parentId,
    author: {
      _id: post.author._id?.toString() || '',
      id: post.author.id,
      name: post.author.name,
      image: post.author.image,
    },
    community: post.community ? {
      _id: post.community._id?.toString() || '',
      id: post.community.id,
      name: post.community.name,
      image: post.community.image,
    } : null,
    createdAt: post.createdAt.toISOString(),
    children: post.children.map((child: any) => ({
      _id: child._id?.toString() || '',
      author: {
        _id: child.author?._id?.toString() || '',
        id: child.author?.id || '',
        name: child.author?.name || '',
        image: child.author?.image || '/assets/user.svg'
      },
    })),
    hashtags: post.hashtags || [],
    mentions: post.mentions?.map((mention: any) => ({
      userId: mention.userId?.toString() || (typeof mention.userId === 'string' ? mention.userId : ''),
      username: mention.username || ''
    })) || [],
    likes: post.likes?.map((like: any) => like.toString()) || [],
    shares: post.shares?.map((share: any) => share.toString()) || [],
    attachments: post.attachments?.map((attachment: any) => ({
      type: attachment.type || '',
      url: attachment.url || '',
      filename: attachment.filename || '',
      size: attachment.size || 0
    })) || [],
    // Add a flag to check if current user has liked this post
    isLikedByCurrentUser: currentUserObjectId ? 
      post.likes?.some((like: any) => like.toString() === currentUserObjectId.toString()) || false 
      : false,
  }));

  return { posts: serializedPosts, isNext };
}

interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
  hashtags?: string[],
  mentions?: { userId: string; username: string }[],
  communityTags?: { communityId: string; communityUsername: string }[],
  attachments?: { type: string; url: string; filename?: string; size?: number }[],
}

export async function createChirp({ 
  text, 
  author, 
  communityId, 
  path, 
  hashtags = [], 
  mentions = [],
  communityTags = [],
  attachments = []
}: Params) {
  try {
    console.log("Creating chirp with attachments:", attachments);
    await connectToDB();

    // Resolve author ID using the utility function
    const authorObjectId = await resolveUserObjectId(author);
    console.log("Author resolved:", authorObjectId);

    let communityIdObject = null;
    let communityData = null;
    
    // If posting to a specific community, validate membership and permissions
    if (communityId) {
      const community = await Community.findOne({ id: communityId });
      
      if (!community) {
        throw new Error("Community not found");
      }
      
      // Check if user is a member of the community
      if (!community.isMember(authorObjectId)) {
        throw new Error("You must be a member of this community to post");
      }
      
      // Check if community allows member posts
      if (!community.settings.allowMemberPosts && !community.isAdmin(authorObjectId)) {
        throw new Error("Only admins can post in this community");
      }
      
      communityIdObject = community._id;
      communityData = {
        _id: community._id,
        id: community.id,
        name: community.name,
        username: community.username,
        image: community.image,
        isPrivate: community.isPrivate,
      };
    }

    console.log("Creating chirp document with data:", {
      text,
      author: authorObjectId,
      community: communityIdObject,
      hashtags,
      mentions,
      communityTags,
      attachments
    });

    const createdChirp = await Chirp.create({
      text,
      author: authorObjectId,
      community: communityIdObject, // For community-specific posts
      hashtags,
      mentions,
      communityTags, // For community tagging in regular posts
      attachments,
    });
    
    console.log("Chirp created successfully with ID:", createdChirp._id);

    // Update User model
    await User.findByIdAndUpdate(authorObjectId, {
      $push: { chirps: createdChirp._id },
    });

    // Update Community model for community-specific posts
    if (communityIdObject) {
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { chirps: createdChirp._id },
      });
    }
    
    // Add chirp to tagged communities (for community tagging in regular posts)
    if (communityTags && communityTags.length > 0) {
      for (const tag of communityTags) {
        const taggedCommunity = await Community.findOne({ username: tag.communityUsername });
        if (taggedCommunity) {
          await Community.findByIdAndUpdate(taggedCommunity._id, {
            $push: { chirps: createdChirp._id },
          });
        }
      }
    }

    // Trigger mention notifications if there are mentions
    if (mentions && mentions.length > 0) {
      const mentionedUserIds = mentions.map(mention => mention.userId);
      // Run notification in background
      triggerMentionNotifications(mentionedUserIds, author, text).catch(error => {
        console.error('Failed to send mention notifications:', error);
      });
    }

    revalidatePath(path);
    
    // Return the created chirp with community info for Facebook-style display
    // Ensure all values are serializable
    const result = {
      _id: createdChirp._id?.toString() || '',
      text: createdChirp.text || '',
      author: {
        id: author,
      },
      community: communityData,
      hashtags: Array.isArray(createdChirp.hashtags) ? [...createdChirp.hashtags] : [],
      mentions: Array.isArray(createdChirp.mentions) 
        ? createdChirp.mentions.map((mention: any) => ({
            userId: mention.userId?.toString() || (typeof mention.userId === 'string' ? mention.userId : ''),
            username: mention.username || ''
          }))
        : [],
      communityTags: Array.isArray(createdChirp.communityTags)
        ? createdChirp.communityTags.map((tag: any) => ({
            communityId: tag.communityId?.toString() || (typeof tag.communityId === 'string' ? tag.communityId : ''),
            communityUsername: tag.communityUsername || ''
          }))
        : [],
      attachments: Array.isArray(createdChirp.attachments)
        ? createdChirp.attachments.map((attachment: any) => ({
            type: attachment.type || "",
            url: attachment.url || "",
            filename: attachment.filename || "",
            size: attachment.size || 0,
          }))
        : [],
      createdAt: createdChirp.createdAt.toISOString(),
    };
    
    // Log the result to verify it's serializable
    console.log("Returning serializable chirp result:", JSON.stringify(result, null, 2));
    
    return result;
  } catch (error: any) {
    console.error("Error creating chirp:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw new Error(`Failed to create chirp: ${error.message}`);
  }
}

async function fetchAllChildChirps(chirpId: string, visited: Set<string> = new Set(), depth: number = 0): Promise<any[]> {
  // Prevent infinite recursion
  if (depth > 100) {
    console.warn("Maximum depth reached in fetchAllChildChirps for chirp:", chirpId);
    return [];
  }
  
  // Prevent circular references
  if (visited.has(chirpId)) {
    console.warn("Circular reference detected in fetchAllChildChirps for chirp:", chirpId);
    return [];
  }
  
  visited.add(chirpId);
  
  const childChirps = await Chirp.find({ parentId: chirpId });

  const descendantChirps = [];
  for (const childChirp of childChirps) {
    const descendants = await fetchAllChildChirps(childChirp._id?.toString() || '', new Set(visited), depth + 1);
    descendantChirps.push(childChirp, ...descendants);
  }

  return descendantChirps;
}

export async function deleteChirp(id: string, path: string): Promise<void> {
  try {
    await connectToDB();

    // Find the chirp to be deleted (the main chirp)
    const mainChirp = await Chirp.findById(id).populate("author community");

    if (!mainChirp) {
      throw new Error("Chirp not found");
    }

    // Fetch all child chirps and their descendants recursively
    const descendantChirps = await fetchAllChildChirps(id, new Set());

    // Get all descendant chirp IDs including the main chirp ID and child chirp IDs
    const descendantChirpIds = [
      id,
      ...descendantChirps.map((chirp) => chirp._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantChirps.map((chirp) => chirp.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainChirp.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantChirps.map((chirp) => chirp.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainChirp.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child chirps and their descendants
    await Chirp.deleteMany({ _id: { $in: descendantChirpIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { chirps: { $in: descendantChirpIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { chirps: { $in: descendantChirpIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete chirp: ${error.message}`);
  }
}

export async function fetchChirpById(chirpId: string, currentUserId?: string) {
  await connectToDB();

  try {
    // Resolve current user's ObjectId if provided
    let currentUserObjectId: any = null;
    if (currentUserId) {
      try {
        currentUserObjectId = await resolveUserObjectId(currentUserId);
      } catch (error) {
        console.error('Error resolving current user ObjectId:', error);
      }
    }
    const chirp = await Chirp.findById(chirpId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      }) // Populate the author field with _id and username
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      }) // Populate the community field with _id and name
      .populate({
        path: "children", // Populate the children field
        populate: {
          path: "author", // Populate the author field within children
          model: User,
          select: "_id id name parentId image", // Select only _id and username fields of the author
        },
      })
      .exec();

    // Serialize the chirp to a plain object
    const serializedChirp = {
      _id: chirp._id?.toString() || '',
      text: chirp.text,
      parentId: chirp.parentId,
      author: {
        _id: chirp.author._id?.toString() || '',
        id: chirp.author.id,
        name: chirp.author.name,
        image: chirp.author?.image || '/assets/user.svg',
      },
      community: chirp.community ? {
        _id: chirp.community._id?.toString() || '',
        id: chirp.community.id,
        name: chirp.community.name,
        image: chirp.community.image,
      } : null,
      createdAt: chirp.createdAt.toISOString(),
      children: chirp.children.map((child: any) => ({
        _id: child._id?.toString() || '',
        text: child.text,
        parentId: child.parentId,
        author: {
          _id: child.author._id?.toString() || '',
          id: child.author.id,
          name: child.author.name,
          image: child.author?.image || '/assets/user.svg',
        },
        createdAt: child.createdAt.toISOString(),
        children: [], // No nested children populated for performance
        hashtags: child.hashtags || [],
        mentions: child.mentions || [],
        likes: child.likes?.map((like: any) => like.toString()) || [],
        shares: child.shares?.map((share: any) => share.toString()) || [],
        attachments: child.attachments || [],
        isLikedByCurrentUser: currentUserObjectId ?
          child.likes?.some((like: any) => like.toString() === currentUserObjectId.toString()) || false
          : false,
      })),
      hashtags: chirp.hashtags || [],
      mentions: chirp.mentions || [],
      likes: chirp.likes?.map((like: any) => like.toString()) || [],
      shares: chirp.shares?.map((share: any) => share.toString()) || [],
      attachments: chirp.attachments || [],
      isLikedByCurrentUser: currentUserObjectId ? 
        chirp.likes?.some((like: any) => like.toString() === currentUserObjectId.toString()) || false 
        : false,
    };

    return serializedChirp;
  } catch (err) {
    console.error("Error while fetching chirp:", err);
    throw new Error("Unable to fetch chirp");
  }
}

export async function addCommentToChirp(
  chirpId: string,
  commentText: string,
  userId: string,
  path: string,
  hashtags: string[] = [],
  mentions: { userId: string; username: string }[] = []
) {
  await connectToDB();

  try {
    // Resolve user ID using the utility function
    const userObjectId = await resolveUserObjectId(userId);

    // Find the original chirp by its ID
    const originalChirp = await Chirp.findById(chirpId).populate('author');

    if (!originalChirp) {
      throw new Error("Chirp not found");
    }

    // Create the new comment chirp
    const commentChirp = new Chirp({
      text: commentText,
      author: userObjectId,
      parentId: chirpId, // Set the parentId to the original chirp's ID
      hashtags,
      mentions,
    });

    // Save the comment chirp to the database
    const savedCommentChirp = await commentChirp.save();

    // Add the comment chirp's ID to the original chirp's children array
    originalChirp.children.push(savedCommentChirp._id);

    // Save the updated original chirp to the database
    await originalChirp.save();

    // Trigger comment notification for the original author
    if (originalChirp.author && originalChirp.author._id?.toString() !== userId) {
      triggerCommentNotification(
        originalChirp.author._id?.toString() || '',
        userId,
        originalChirp.text,
        commentText
      ).catch(error => {
        console.error('Failed to send comment notification:', error);
      });
    }

    // Trigger mention notifications if there are mentions in the comment
    if (mentions && mentions.length > 0) {
      const mentionedUserIds = mentions.map(mention => mention.userId);
      triggerMentionNotifications(mentionedUserIds, userId, commentText).catch(error => {
        console.error('Failed to send mention notifications:', error);
      });
    }

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}

export async function fetchChirpsByHashtag(hashtag: string, currentUserId?: string) {
  await connectToDB();

  try {
    // Resolve current user's ObjectId if provided
    let currentUserObjectId: any = null;
    if (currentUserId) {
      try {
        currentUserObjectId = await resolveUserObjectId(currentUserId);
      } catch (error) {
        console.error('Error resolving current user ObjectId:', error);
      }
    }
    const chirps = await Chirp.find({ 
      hashtags: { $in: [hashtag.toLowerCase()] },
      parentId: { $in: [null, undefined] }
    })
    .sort({ createdAt: "desc" })
    .populate({
      path: "author",
      model: User,
      select: "_id id name image",
    })
    .populate({
      path: "community",
      model: Community,
      select: "_id id name image",
    })
    .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id name parentId image",
      },
    })
    .exec();

    // Serialize the chirps to plain objects
    const serializedChirps = chirps.map((chirp: any) => ({
      _id: chirp._id?.toString() || '',
      text: chirp.text,
      parentId: chirp.parentId,
      author: {
        _id: chirp.author._id?.toString() || '',
        id: chirp.author.id,
        name: chirp.author.name,
        image: chirp.author?.image || '/assets/user.svg',
      },
      community: chirp.community ? {
        _id: chirp.community._id?.toString() || '',
        id: chirp.community.id,
        name: chirp.community.name,
        image: chirp.community.image,
      } : null,
      createdAt: chirp.createdAt.toISOString(),
      children: chirp.children.map((child: any) => ({
        _id: child._id?.toString() || '',
        author: {
          image: child.author?.image || '/assets/user.svg',
        },
      })),
      hashtags: chirp.hashtags || [],
      mentions: chirp.mentions || [],
      communityTags: chirp.communityTags || [],
      likes: chirp.likes?.map((like: any) => like.toString()) || [],
      shares: chirp.shares?.map((share: any) => share.toString()) || [],
      attachments: chirp.attachments || [],
      isLikedByCurrentUser: currentUserObjectId ? 
        chirp.likes?.some((like: any) => like.toString() === currentUserObjectId.toString()) || false 
        : false,
    }));

    return { chirps: serializedChirps };
  } catch (err) {
    console.error("Error while fetching chirps by hashtag:", err);
    throw new Error("Unable to fetch chirps by hashtag");
  }
}

// New function to fetch chirps by community tag
export async function fetchChirpsByCommunityTag(communityUsername: string, currentUserId?: string) {
  await connectToDB();

  try {
    // Resolve current user's ObjectId if provided
    let currentUserObjectId: any = null;
    if (currentUserId) {
      try {
        currentUserObjectId = await resolveUserObjectId(currentUserId);
      } catch (error) {
        console.error('Error resolving current user ObjectId:', error);
      }
    }
    
    const chirps = await Chirp.find({ 
      'communityTags.communityUsername': communityUsername.toLowerCase(),
      parentId: { $in: [null, undefined] }
    })
    .sort({ createdAt: "desc" })
    .populate({
      path: "author",
      model: User,
      select: "_id id name image",
    })
    .populate({
      path: "community",
      model: Community,
      select: "_id id name image",
    })
    .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id name parentId image",
      },
    })
    .exec();

    // Serialize the chirps to plain objects
    const serializedChirps = chirps.map((chirp: any) => ({
      _id: chirp._id?.toString() || '',
      text: chirp.text,
      parentId: chirp.parentId,
      author: {
        _id: chirp.author._id?.toString() || '',
        id: chirp.author.id,
        name: chirp.author.name,
        image: chirp.author?.image || '/assets/user.svg',
      },
      community: chirp.community ? {
        _id: chirp.community._id?.toString() || '',
        id: chirp.community.id,
        name: chirp.community.name,
        image: chirp.community.image,
      } : null,
      createdAt: chirp.createdAt.toISOString(),
      children: chirp.children.map((child: any) => ({
        _id: child._id?.toString() || '',
        author: {
          image: child.author?.image || '/assets/user.svg',
        },
      })),
      hashtags: chirp.hashtags || [],
      mentions: chirp.mentions || [],
      communityTags: chirp.communityTags || [],
      likes: chirp.likes?.map((like: any) => like.toString()) || [],
      shares: chirp.shares?.map((share: any) => share.toString()) || [],
      attachments: chirp.attachments || [],
      isLikedByCurrentUser: currentUserObjectId ? 
        chirp.likes?.some((like: any) => like.toString() === currentUserObjectId.toString()) || false 
        : false,
    }));

    return { chirps: serializedChirps };
  } catch (err) {
    console.error("Error while fetching chirps by community tag:", err);
    throw new Error("Unable to fetch chirps by community tag");
  }
}

// Like/Unlike functionality
export async function toggleLikeChirp(chirpId: string, userId: string, path: string) {
  try {
    await connectToDB();

    // Resolve user ID using the utility function
    const userObjectId = await resolveUserObjectId(userId);

    const chirp = await Chirp.findById(chirpId).populate('author');
    if (!chirp) {
      throw new Error("Chirp not found");
    }

    const isLiked = chirp.likes.includes(userObjectId);

    if (isLiked) {
      // Unlike
      await Chirp.findByIdAndUpdate(chirpId, {
        $pull: { likes: userObjectId }
      });
    } else {
      // Like
      await Chirp.findByIdAndUpdate(chirpId, {
        $push: { likes: userObjectId }
      });
      
      // Trigger like notification for the chirp author
      if (chirp.author && chirp.author._id?.toString() !== userId) {
        triggerLikeNotification(
          chirp.author._id?.toString() || '',
          userId,
          chirp.text
        ).catch(error => {
          console.error('Failed to send like notification:', error);
        });
      }
    }

    revalidatePath(path);
    return !isLiked; // Return new like status
  } catch (error: any) {
    throw new Error(`Failed to toggle like: ${error.message}`);
  }
}

// Share functionality
export async function shareChirp(chirpId: string, userId: string, path: string) {
  try {
    await connectToDB();

    // Resolve user ID using the utility function
    const userObjectId = await resolveUserObjectId(userId);

    const chirp = await Chirp.findById(chirpId);
    if (!chirp) {
      throw new Error("Chirp not found");
    }

    const isShared = chirp.shares.includes(userObjectId);

    if (!isShared) {
      await Chirp.findByIdAndUpdate(chirpId, {
        $push: { shares: userObjectId }
      });
    }

    revalidatePath(path);
    return true;
  } catch (error: any) {
    throw new Error(`Failed to share chirp: ${error.message}`);
  }
}