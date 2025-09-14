"use server";

import { connectToDB } from "../mongoose";
import User from "../models/user.model";

export async function searchUsersForMention(searchTerm: string) {
  try {
    await connectToDB();

    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    // Create a case-insensitive regex for searching
    const regex = new RegExp(searchTerm, "i");

    const users = await User.find({
      $or: [
        { username: { $regex: regex } },
        { name: { $regex: regex } }
      ]
    })
    .select("id name username image")
    .limit(10)
    .exec();

    return users;
  } catch (error) {
    console.error("Error searching users for mention:", error);
    return [];
  }
}

export async function getUsersByUsernames(usernames: string[]) {
  try {
    await connectToDB();

    if (!usernames || usernames.length === 0) {
      return [];
    }

    const users = await User.find({
      username: { $in: usernames }
    })
    .select("_id id name username")
    .exec();

    return users;
  } catch (error) {
    console.error("Error fetching users by usernames:", error);
    return [];
  }
}