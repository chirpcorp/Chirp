// Utility for resolving user IDs between Clerk and MongoDB systems

import { connectToDB } from "../mongoose";
import User from "../models/user.model";

/**
 * Resolves a user ID that could be either a Clerk ID or MongoDB ObjectId
 * to a MongoDB ObjectId that can be used in database operations
 * 
 * @param userId - Either a Clerk ID (starts with 'user_') or MongoDB ObjectId string
 * @returns MongoDB ObjectId that can be used in database operations
 * @throws Error if user is not found
 */
export async function resolveUserObjectId(userId: string): Promise<any> {
  "use server";
  
  try {
    await connectToDB();
    
    if (typeof userId === 'string' && userId.startsWith('user_')) {
      // It's a Clerk ID, find the corresponding MongoDB user
      const user = await User.findOne({ id: userId });
      if (!user) throw new Error(`User not found for Clerk ID: ${userId}`);
      return user._id;
    } else {
      // It's already a MongoDB ObjectId (or should be)
      // For safety, verify it exists in the database
      const user = await User.findById(userId);
      if (!user) throw new Error(`User not found for ObjectId: ${userId}`);
      return user._id;
    }
  } catch (error: any) {
    console.error("Error resolving user ID:", error);
    throw new Error(`Failed to resolve user ID: ${error.message}`);
  }
}

/**
 * Resolves multiple user IDs in a single operation for better performance
 * 
 * @param userIds - Array of user IDs (Clerk IDs or MongoDB ObjectIds)
 * @returns Array of MongoDB ObjectIds
 */
export async function resolveMultipleUserObjectIds(userIds: string[]): Promise<any[]> {
  "use server";
  
  try {
    await connectToDB();
    
    const clerkIds = userIds.filter(id => id.startsWith('user_'));
    const objectIds = userIds.filter(id => !id.startsWith('user_'));
    
    const resolvedIds: any[] = [];
    
    // Resolve Clerk IDs
    if (clerkIds.length > 0) {
      const users = await User.find({ id: { $in: clerkIds } }).select('_id');
      resolvedIds.push(...users.map(user => user._id));
    }
    
    // Validate existing ObjectIds
    if (objectIds.length > 0) {
      const users = await User.find({ _id: { $in: objectIds } }).select('_id');
      resolvedIds.push(...users.map(user => user._id));
    }
    
    return resolvedIds;
  } catch (error: any) {
    console.error("Error resolving multiple user IDs:", error);
    throw new Error(`Failed to resolve user IDs: ${error.message}`);
  }
}

/**
 * Check if a user ID is a Clerk ID or MongoDB ObjectId
 * 
 * @param userId - User ID to check
 * @returns Object with boolean flags indicating the type
 */
export function getUserIdType(userId: string): { isClerkId: boolean; isObjectId: boolean } {
  return {
    isClerkId: typeof userId === 'string' && userId.startsWith('user_'),
    isObjectId: typeof userId === 'string' && !userId.startsWith('user_') && userId.length === 24
  };
}