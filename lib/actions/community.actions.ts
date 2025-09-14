"use server";

import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";

import Community from "../models/community.model";
import Chirp from "../models/chirp.model.enhanced";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";
import { resolveUserObjectId } from "../utils/userIdResolver";

// Create a new community (Facebook group style)
export async function createCommunity({
  name,
  username,
  description,
  image,
  coverImage,
  creatorId,
  isPrivate = false,
  tags = [],
  rules = [],
  path,
}: {
  name: string;
  username: string;
  description?: string;
  image?: string;
  coverImage?: string;
  creatorId: string;
  isPrivate?: boolean;
  tags?: string[];
  rules?: { title: string; description: string }[];
  path: string;
}) {
  try {
    await connectToDB();

    // Resolve creator's ObjectId
    const creatorObjectId = await resolveUserObjectId(creatorId);
    
    // Generate a unique ID for the community
    const communityId = `community-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newCommunity = new Community({
      id: communityId,
      name,
      username: username.toLowerCase(),
      description,
      image: image || '/assets/community-default.svg',
      coverImage,
      creator: creatorObjectId,
      isPrivate,
      tags,
      rules,
      admins: [creatorObjectId], // Creator is automatically an admin
      members: [{
        user: creatorObjectId,
        role: 'admin', // Changed from 'creator' to 'admin' to match valid enum values
        joinedAt: new Date()
      }],
      settings: {
        allowMemberPosts: true,
        requireApprovalForPosts: false,
        allowMemberInvites: true,
        showMemberList: !isPrivate, // Hide member list for private communities by default
      },
    });

    const createdCommunity = await newCommunity.save();

    // Update User model to add community to user's communities
    await User.findByIdAndUpdate(creatorObjectId, {
      $push: { communities: createdCommunity._id },
    });

    revalidatePath(path);
    return {
      _id: createdCommunity._id.toString(),
      id: createdCommunity.id,
      name: createdCommunity.name,
      username: createdCommunity.username,
      image: createdCommunity.image,
      description: createdCommunity.description,
      isPrivate: createdCommunity.isPrivate,
      memberCount: createdCommunity.memberCount,
    };
  } catch (error) {
    console.error("Error creating community:", error);
    throw new Error(`Failed to create community: ${error}`);
  }
}

// Join a community (Facebook-style)
export async function joinCommunity({
  communityId,
  userId,
  message,
  path,
}: {
  communityId: string;
  userId: string;
  message?: string;
  path: string;
}) {
  try {
    await connectToDB();

    const userObjectId = await resolveUserObjectId(userId);
    
    // First try to find by custom id field
    let community = await Community.findOne({ id: communityId });
    
    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: communityId });
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Check if user is already a member
    if (community.isMember(userObjectId)) {
      throw new Error("User is already a member of this community");
    }

    if (community.isPrivate) {
      // For private communities, add to join requests
      const existingRequest = community.joinRequests.find(
        (req: any) => req.user.toString() === userObjectId.toString()
      );

      if (existingRequest) {
        throw new Error("Join request already pending");
      }

      community.joinRequests.push({
        user: userObjectId,
        message: message || '',
        requestedAt: new Date(),
      });

      await community.save();
      
      revalidatePath(path);
      return { status: 'request_sent', message: 'Join request sent to community admins' };
    } else {
      // For public communities, add directly as member
      community.members.push({
        user: userObjectId,
        role: 'member',
        joinedAt: new Date(),
      });

      await community.save();

      // Add community to user's communities
      await User.findByIdAndUpdate(userObjectId, {
        $push: { communities: community._id },
      });

      revalidatePath(path);
      return { status: 'joined', message: 'Successfully joined the community' };
    }
  } catch (error) {
    console.error("Error joining community:", error);
    throw error;
  }
}

// Leave a community
export async function leaveCommunity({
  communityId,
  userId,
  path,
}: {
  communityId: string;
  userId: string;
  path: string;
}) {
  try {
    await connectToDB();

    const userObjectId = await resolveUserObjectId(userId);
    
    // First try to find by custom id field
    let community = await Community.findOne({ id: communityId });
    
    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: communityId });
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Check if user is the creator
    if (community.isCreator(userObjectId)) {
      throw new Error("Community creator cannot leave. Transfer ownership or delete the community instead.");
    }

    // Remove user from members
    community.members = community.members.filter(
      (member: any) => member.user.toString() !== userObjectId.toString()
    );

    // Remove from admins and moderators if applicable
    community.admins = community.admins.filter(
      (adminId: any) => adminId.toString() !== userObjectId.toString()
    );
    community.moderators = community.moderators.filter(
      (modId: any) => modId.toString() !== userObjectId.toString()
    );

    await community.save();

    // Remove community from user's communities
    await User.findByIdAndUpdate(userObjectId, {
      $pull: { communities: community._id },
    });

    revalidatePath(path);
    return { status: 'left', message: 'Successfully left the community' };
  } catch (error) {
    console.error("Error leaving community:", error);
    throw error;
  }
}

// Approve join request (Admin only)
export async function approveJoinRequest({
  communityId,
  requestUserId,
  adminId,
  path,
}: {
  communityId: string;
  requestUserId: string;
  adminId: string;
  path: string;
}) {
  try {
    connectToDB();

    const adminObjectId = await resolveUserObjectId(adminId);
    const requestUserObjectId = await resolveUserObjectId(requestUserId);
    
    // First try to find by custom id field
    let community = await Community.findOne({ id: communityId });
    
    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: communityId });
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Check if admin has permission
    if (!community.isAdmin(adminObjectId) && !community.isCreator(adminObjectId)) {
      throw new Error("Only admins can approve join requests");
    }

    // Find and remove the join request
    const requestIndex = community.joinRequests.findIndex(
      (req: any) => req.user.toString() === requestUserObjectId.toString()
    );

    if (requestIndex === -1) {
      throw new Error("Join request not found");
    }

    community.joinRequests.splice(requestIndex, 1);

    // Add user as member
    community.members.push({
      user: requestUserObjectId,
      role: 'member',
      joinedAt: new Date(),
    });

    await community.save();

    // Add community to user's communities
    await User.findByIdAndUpdate(requestUserObjectId, {
      $push: { communities: community._id },
    });

    revalidatePath(path);
    return { status: 'approved', message: 'Join request approved successfully' };
  } catch (error) {
    console.error("Error approving join request:", error);
    throw error;
  }
}

// Reject join request (Admin only)
export async function rejectJoinRequest({
  communityId,
  requestUserId,
  adminId,
  path,
}: {
  communityId: string;
  requestUserId: string;
  adminId: string;
  path: string;
}) {
  try {
    connectToDB();

    const adminObjectId = await resolveUserObjectId(adminId);
    const requestUserObjectId = await resolveUserObjectId(requestUserId);
    
    // First try to find by custom id field
    let community = await Community.findOne({ id: communityId });
    
    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: communityId });
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Check if admin has permission
    if (!community.isAdmin(adminObjectId) && !community.isCreator(adminObjectId)) {
      throw new Error("Only admins can reject join requests");
    }

    // Find and remove the join request
    const requestIndex = community.joinRequests.findIndex(
      (req: any) => req.user.toString() === requestUserObjectId.toString()
    );

    if (requestIndex === -1) {
      throw new Error("Join request not found");
    }

    community.joinRequests.splice(requestIndex, 1);
    await community.save();

    revalidatePath(path);
    return { status: 'rejected', message: 'Join request rejected' };
  } catch (error) {
    console.error("Error rejecting join request:", error);
    throw error;
  }
}

// Remove member (Admin only)
export async function removeMember({
  communityId,
  memberId,
  adminId,
  path,
}: {
  communityId: string;
  memberId: string;
  adminId: string;
  path: string;
}) {
  try {
    connectToDB();

    const adminObjectId = await resolveUserObjectId(adminId);
    const memberObjectId = await resolveUserObjectId(memberId);
    
    // First try to find by custom id field
    let community = await Community.findOne({ id: communityId });
    
    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: communityId });
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Check if admin has permission
    if (!community.isAdmin(adminObjectId) && !community.isCreator(adminObjectId)) {
      throw new Error("Only admins can remove members");
    }

    // Cannot remove creator
    if (community.isCreator(memberObjectId)) {
      throw new Error("Cannot remove community creator");
    }

    // Remove user from members
    community.members = community.members.filter(
      (member: any) => member.user.toString() !== memberObjectId.toString()
    );

    // Remove from admins and moderators if applicable
    community.admins = community.admins.filter(
      (id: any) => id.toString() !== memberObjectId.toString()
    );
    community.moderators = community.moderators.filter(
      (id: any) => id.toString() !== memberObjectId.toString()
    );

    await community.save();

    // Remove community from user's communities
    await User.findByIdAndUpdate(memberObjectId, {
      $pull: { communities: community._id },
    });

    revalidatePath(path);
    return { status: 'removed', message: 'Member removed successfully' };
  } catch (error) {
    console.error("Error removing member:", error);
    throw error;
  }
}

// Promote to admin (Creator only)
export async function promoteToAdmin({
  communityId,
  memberId,
  creatorId,
  path,
}: {
  communityId: string;
  memberId: string;
  creatorId: string;
  path: string;
}) {
  try {
    connectToDB();

    const creatorObjectId = await resolveUserObjectId(creatorId);
    const memberObjectId = await resolveUserObjectId(memberId);
    
    // First try to find by custom id field
    let community = await Community.findOne({ id: communityId });
    
    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: communityId });
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Only creator can promote to admin
    if (!community.isCreator(creatorObjectId)) {
      throw new Error("Only community creator can promote members to admin");
    }

    // Check if user is a member
    if (!community.isMember(memberObjectId)) {
      throw new Error("User is not a member of this community");
    }

    // Check if already admin
    if (community.isAdmin(memberObjectId)) {
      throw new Error("User is already an admin");
    }

    // Add to admins
    community.admins.push(memberObjectId);

    // Update member role
    const memberIndex = community.members.findIndex(
      (member: any) => member.user.toString() === memberObjectId.toString()
    );
    if (memberIndex !== -1) {
      community.members[memberIndex].role = 'admin';
    }

    await community.save();

    revalidatePath(path);
    return { status: 'promoted', message: 'Member promoted to admin successfully' };
  } catch (error) {
    console.error("Error promoting to admin:", error);
    throw error;
  }
}

// Delete community (Creator only)
export async function deleteCommunity({
  communityId,
  creatorId,
  path,
}: {
  communityId: string;
  creatorId: string;
  path: string;
}) {
  try {
    await connectToDB();

    const creatorObjectId = await resolveUserObjectId(creatorId);
    
    // First try to find by custom id field
    let community = await Community.findOne({ id: communityId });
    
    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: communityId });
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Only creator can delete community
    if (!community.isCreator(creatorObjectId)) {
      throw new Error("Only community creator can delete the community");
    }

    // Delete all chirps associated with the community
    await Chirp.deleteMany({ community: community._id });

    // Remove community from all members' communities array
    await User.updateMany(
      { communities: community._id },
      { $pull: { communities: community._id } }
    );

    // Delete the community
    await Community.findByIdAndDelete(community._id);

    revalidatePath(path);
    return { status: 'deleted', message: 'Community deleted successfully' };
  } catch (error) {
    console.error("Error deleting community:", error);
    throw error;
  }
}

// Fetch community details with privacy-aware member info
export async function fetchCommunityDetails(id: string, currentUserId?: string) {
  try {
    await connectToDB();

    const currentUserObjectId = currentUserId ? await resolveUserObjectId(currentUserId) : null;

    // First try to find by custom id field
    let community = await Community.findOne({ id })
      .populate([
        {
          path: "creator",
          model: User,
          select: "name username image _id id",
        },
        {
          path: "members.user",
          model: User,
          select: "name username image _id id",
        },
        {
          path: "admins",
          model: User,
          select: "name username image _id id",
        },
        {
          path: "moderators",
          model: User,
          select: "name username image _id id",
        },
        {
          path: "joinRequests.user",
          model: User,
          select: "name username image _id id",
        },
      ]);

    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: id })
        .populate([
          {
            path: "creator",
            model: User,
            select: "name username image _id id",
          },
          {
            path: "members.user",
            model: User,
            select: "name username image _id id",
          },
          {
            path: "admins",
            model: User,
            select: "name username image _id id",
          },
          {
            path: "moderators",
            model: User,
            select: "name username image _id id",
          },
          {
            path: "joinRequests.user",
            model: User,
            select: "name username image _id id",
          },
        ]);
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Check if current user is a member or admin
    const isMember = currentUserObjectId ? community.isMember(currentUserObjectId) : false;
    const isAdmin = currentUserObjectId ? community.isAdmin(currentUserObjectId) : false;
    const isCreator = currentUserObjectId ? community.isCreator(currentUserObjectId) : false;

    // Serialize community data
    const serializedCommunity: any = {
      _id: community._id.toString(),
      id: community.id,
      name: community.name,
      username: community.username,
      description: community.description,
      image: community.image,
      coverImage: community.coverImage,
      isPrivate: community.isPrivate,
      tags: community.tags,
      rules: community.rules,
      memberCount: community.memberCount,
      postCount: community.postCount,
      createdAt: community.createdAt.toISOString(),
      creator: community.creator ? {
        _id: community.creator._id.toString(),
        id: community.creator.id,
        name: community.creator.name,
        username: community.creator.username,
        image: community.creator.image,
      } : null,
      currentUserRole: community.getMemberRole(currentUserObjectId),
      isMember,
      isAdmin,
      isCreator,
      settings: community.settings,
      members: [],
      joinRequests: [],
    };

    // Only show member list and join requests to members (or public communities)
    if (isMember || !community.isPrivate || isAdmin) {
      serializedCommunity.members = community.members.map((member: any) => ({
        _id: member.user._id.toString(),
        id: member.user.id,
        name: member.user.name,
        username: member.user.username,
        image: member.user.image,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
      }));
    } else {
      serializedCommunity.members = [];
    }

    // Only show join requests to admins
    if (isAdmin || isCreator) {
      serializedCommunity.joinRequests = community.joinRequests.map((request: any) => ({
        _id: request.user._id.toString(),
        id: request.user.id,
        name: request.user.name,
        username: request.user.username,
        image: request.user.image,
        message: request.message,
        requestedAt: request.requestedAt.toISOString(),
      }));
    } else {
      serializedCommunity.joinRequests = [];
    }

    return serializedCommunity;
  } catch (error) {
    console.error("Error fetching community details:", error);
    throw error;
  }
}

// Fetch community posts with privacy controls
export async function fetchCommunityPosts(id: string, currentUserId?: string) {
  try {
    await connectToDB();

    const currentUserObjectId = currentUserId ? await resolveUserObjectId(currentUserId) : null;
    
    // First try to find by custom id field
    let community = await Community.findOne({ id });
    
    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: id });
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Check privacy permissions
    if (community.isPrivate && currentUserObjectId && !community.isMember(currentUserObjectId)) {
      throw new Error("You don't have permission to view posts from this private community");
    }

    const communityWithPosts = await Community.findById(community._id).populate({
      path: "chirps",
      model: Chirp,
      populate: [
        {
          path: "author",
          model: User,
          select: "name image id username",
        },
        {
          path: "children",
          model: Chirp,
          populate: {
            path: "author",
            model: User,
            select: "image _id name username",
          },
        },
      ],
    });

    // Serialize the community posts with Facebook-style community info
    const serializedChirps = communityWithPosts.chirps.map((chirp: any) => ({
      _id: chirp._id.toString(),
      text: chirp.text,
      parentId: chirp.parentId,
      author: {
        _id: chirp.author._id.toString(),
        id: chirp.author.id,
        name: chirp.author.name,
        username: chirp.author.username,
        image: chirp.author.image,
      },
      community: {
        _id: community._id.toString(),
        id: community.id,
        name: community.name,
        username: community.username,
        image: community.image,
        isPrivate: community.isPrivate,
      },
      createdAt: chirp.createdAt.toISOString(),
      children: chirp.children.map((child: any) => ({
        _id: child._id.toString(),
        author: {
          _id: child.author._id.toString(),
          name: child.author.name,
          username: child.author.username,
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
      community: {
        _id: community._id.toString(),
        id: community.id,
        name: community.name,
        username: community.username,
        image: community.image,
        isPrivate: community.isPrivate,
      },
    };
  } catch (error) {
    console.error("Error fetching community posts:", error);
    throw error;
  }
}

// Fetch communities with privacy filters
export async function fetchCommunities({
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
  currentUserId,
}: {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
  currentUserId?: string;
}) {
  try {
    await connectToDB();

    const currentUserObjectId = currentUserId ? await resolveUserObjectId(currentUserId) : null;

    // Calculate the number of communities to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter communities.
    const query: FilterQuery<typeof Community> = {};

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched communities based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    // Create a query to fetch the communities based on the search and sort criteria.
    const communitiesQuery = Community.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)
      .populate([
        {
          path: "creator",
          model: User,
          select: "name username image _id id",
        },
        {
          path: "members.user",
          model: User,
          select: "name username image _id id",
        },
      ]);

    // Count the total number of communities that match the search criteria (without pagination).
    const totalCommunitiesCount = await Community.countDocuments(query);

    const communities = await communitiesQuery.exec();

    // Serialize communities with privacy-aware data
    const serializedCommunities = communities.map((community: any) => {
      // Add null safety checks
      const isMember = currentUserObjectId && community.isMember ? community.isMember(currentUserObjectId) : false;
      const isAdmin = currentUserObjectId && community.isAdmin ? community.isAdmin(currentUserObjectId) : false;
      const isCreator = currentUserObjectId && community.isCreator ? community.isCreator(currentUserObjectId) : false;

      return {
        _id: community._id.toString(),
        id: community.id,
        name: community.name,
        username: community.username,
        description: community.description,
        image: community.image,
        isPrivate: community.isPrivate,
        memberCount: community.memberCount,
        postCount: community.postCount,
        creator: community.creator ? {
          _id: community.creator._id.toString(),
          id: community.creator.id,
          name: community.creator.name,
          username: community.creator.username,
          image: community.creator.image,
        } : null,
        tags: community.tags,
        createdAt: community.createdAt.toISOString(),
        isMember: isMember || false,
        isAdmin: isAdmin || false,
        isCreator: isCreator || false,
        userRole: community.getMemberRole ? community.getMemberRole(currentUserObjectId) : null,
        // Only show member list for public communities or if user is a member
        showMembers: !community.isPrivate || isMember,
      };
    });

    // Check if there are more communities beyond the current page.
    const isNext = totalCommunitiesCount > skipAmount + communities.length;

    return { communities: serializedCommunities, isNext };
  } catch (error) {
    console.error("Error fetching communities:", error);
    throw error;
  }
}

// Legacy function - kept for backward compatibility
export async function addMemberToCommunity(
  communityId: string,
  memberId: string
) {
  try {
    return await joinCommunity({
      communityId,
      userId: memberId,
      path: '/communities'
    });
  } catch (error) {
    console.error("Error adding member to community:", error);
    throw error;
  }
}

// Legacy function - kept for backward compatibility
export async function removeUserFromCommunity(
  userId: string,
  communityId: string
) {
  try {
    return await removeMember({
      communityId,
      memberId: userId,
      adminId: userId, // This will fail if user is not admin, which is correct
      path: '/communities'
    });
  } catch (error) {
    console.error("Error removing user from community:", error);
    throw error;
  }
}

// Update community information (Admin only)
export async function updateCommunityInfo({
  communityId,
  name,
  username,
  description,
  image,
  coverImage,
  isPrivate,
  tags,
  rules,
  settings,
  adminId,
  path,
}: {
  communityId: string;
  name?: string;
  username?: string;
  description?: string;
  image?: string;
  coverImage?: string;
  isPrivate?: boolean;
  tags?: string[];
  rules?: { title: string; description: string }[];
  settings?: any;
  adminId: string;
  path: string;
}) {
  try {
    connectToDB();

    const adminObjectId = await resolveUserObjectId(adminId);
    
    // First try to find by custom id field
    let community = await Community.findOne({ id: communityId });
    
    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: communityId });
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Check if user has admin permissions
    if (!community.isAdmin(adminObjectId) && !community.isCreator(adminObjectId)) {
      throw new Error("Only admins can update community information");
    }

    // Update fields if provided
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username.toLowerCase();
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
    if (tags !== undefined) updateData.tags = tags;
    if (rules !== undefined) updateData.rules = rules;
    if (settings !== undefined) updateData.settings = { ...community.settings, ...settings };

    const updatedCommunity = await Community.findOneAndUpdate(
      { id: communityId },
      updateData,
      { new: true }
    );

    revalidatePath(path);
    return {
      _id: updatedCommunity._id.toString(),
      id: updatedCommunity.id,
      name: updatedCommunity.name,
      username: updatedCommunity.username,
      description: updatedCommunity.description,
      image: updatedCommunity.image,
      coverImage: updatedCommunity.coverImage,
      isPrivate: updatedCommunity.isPrivate,
    };
  } catch (error) {
    console.error("Error updating community information:", error);
    throw error;
  }
}

// New function to get communities by usernames (for community tagging)
export async function getCommunitiesByUsernames(usernames: string[]) {
  try {
    connectToDB();
    
    const communities = await Community.find({
      username: { $in: usernames.map(username => username.toLowerCase()) }
    }).select('_id username name image isPrivate');
    
    return communities.map(community => ({
      _id: community._id.toString(),
      username: community.username,
      name: community.name,
      image: community.image,
      isPrivate: community.isPrivate,
    }));
  } catch (error) {
    console.error("Error fetching communities by usernames:", error);
    return [];
  }
}

// Fetch community details by username (for community tag pages)
export async function fetchCommunityDetailsByUsername(username: string, currentUserId?: string) {
  try {
    connectToDB();

    const currentUserObjectId = currentUserId ? await resolveUserObjectId(currentUserId) : null;

    const community = await Community.findOne({ username: username.toLowerCase() })
      .populate([
        {
          path: "creator",
          model: User,
          select: "name username image _id id",
        },
        {
          path: "members.user",
          model: User,
          select: "name username image _id id",
        },
        {
          path: "admins",
          model: User,
          select: "name username image _id id",
        },
        {
          path: "moderators",
          model: User,
          select: "name username image _id id",
        },
        {
          path: "joinRequests.user",
          model: User,
          select: "name username image _id id",
        },
      ]);

    if (!community) {
      return null;
    }

    // Check if current user is a member or admin
    const isMember = currentUserObjectId ? community.isMember(currentUserObjectId) : false;
    const isAdmin = currentUserObjectId ? community.isAdmin(currentUserObjectId) : false;
    const isCreator = currentUserObjectId ? community.isCreator(currentUserObjectId) : false;

    // Serialize community data
    const serializedCommunity: any = {
      _id: community._id.toString(),
      id: community.id,
      name: community.name,
      username: community.username,
      description: community.description,
      image: community.image,
      coverImage: community.coverImage,
      isPrivate: community.isPrivate,
      tags: community.tags,
      rules: community.rules,
      memberCount: community.memberCount,
      postCount: community.postCount,
      createdAt: community.createdAt.toISOString(),
      creator: community.creator ? {
        _id: community.creator._id.toString(),
        id: community.creator.id,
        name: community.creator.name,
        username: community.creator.username,
        image: community.creator.image,
      } : null,
      currentUserRole: community.getMemberRole(currentUserObjectId),
      isMember,
      isAdmin,
      isCreator,
      settings: community.settings,
      members: [],
      joinRequests: [],
    };

    // Only show member list and join requests to members (or public communities)
    if (isMember || !community.isPrivate || isAdmin) {
      serializedCommunity.members = community.members.map((member: any) => ({
        _id: member.user._id.toString(),
        id: member.user.id,
        name: member.user.name,
        username: member.user.username,
        image: member.user.image,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
      }));
    } else {
      serializedCommunity.members = [];
    }

    // Only show join requests to admins
    if (isAdmin || isCreator) {
      serializedCommunity.joinRequests = community.joinRequests.map((request: any) => ({
        _id: request.user._id.toString(),
        id: request.user.id,
        name: request.user.name,
        username: request.user.username,
        image: request.user.image,
        message: request.message,
        requestedAt: request.requestedAt.toISOString(),
      }));
    } else {
      serializedCommunity.joinRequests = [];
    }

    return serializedCommunity;
  } catch (error) {
    console.error("Error fetching community details by username:", error);
    throw error;
  }
}

// Send invitation to join community (Admin only)
export async function inviteToJoinCommunity({
  communityId,
  inviteeId,
  adminId,
  message,
  path,
}: {
  communityId: string;
  inviteeId: string;
  adminId: string;
  message?: string;
  path: string;
}) {
  try {
    connectToDB();

    const adminObjectId = await resolveUserObjectId(adminId);
    const inviteeObjectId = await resolveUserObjectId(inviteeId);
    
    // First try to find by custom id field
    let community = await Community.findOne({ id: communityId });
    
    // If not found by custom id, try to find by username (fallback for URL-based lookups)
    if (!community) {
      community = await Community.findOne({ username: communityId });
    }

    if (!community) {
      throw new Error("Community not found");
    }

    // Check if admin has permission
    if (!community.isAdmin(adminObjectId) && !community.isCreator(adminObjectId)) {
      throw new Error("Only admins can send invitations");
    }

    // Check if user is already a member
    if (community.isMember(inviteeObjectId)) {
      throw new Error("User is already a member of this community");
    }

    // Check if invitation already exists
    const existingInvitation = community.invitations.find(
      (inv: any) => inv.user.toString() === inviteeObjectId.toString()
    );

    if (existingInvitation) {
      throw new Error("Invitation already sent to this user");
    }

    // Add invitation
    community.invitations.push({
      user: inviteeObjectId,
      invitedBy: adminObjectId,
      message: message || '',
      invitedAt: new Date(),
    });

    await community.save();

    revalidatePath(path);
    return { status: 'invited', message: 'Invitation sent successfully' };
  } catch (error) {
    console.error("Error sending invitation:", error);
    throw error;
  }
}
