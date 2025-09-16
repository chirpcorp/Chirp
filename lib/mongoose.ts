import mongoose from "mongoose";

let isConnected = false; // Variable to track the connection status

export const connectToDB = async () => {
  // Set strict query mode for Mongoose to prevent unknown field queries.
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URL) {
    console.error("Missing MONGODB_URL environment variable");
    throw new Error("MONGODB_URL environment variable is required");
  }

  // If the connection is already established, return without creating a new connection.
  if (isConnected) {
    console.log("MongoDB connection already established");
    return;
  }

  try {
    // Connect with reasonable timeout settings to prevent indefinite hanging
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 5000, // 5 seconds instead of default
      socketTimeoutMS: 10000, // 10 seconds
      connectTimeoutMS: 5000, // 5 seconds
    });
    isConnected = true; // Set the connection status to true
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    isConnected = false; // Reset connection status on error
    // Instead of throwing the error, we'll log it but allow the application to continue
    // This prevents the entire app from crashing when MongoDB is unreachable
    console.warn("MongoDB connection failed, continuing without database connection");
  }
};

// Test function to verify connection
export const testConnection = async () => {
  try {
    await connectToDB();
    const db = mongoose.connection;
    if (db.readyState === 1) {
      console.log("MongoDB connection test successful");
      return true;
    } else {
      console.log("MongoDB connection test failed");
      return false;
    }
  } catch (error) {
    console.error("MongoDB connection test error:", error);
    return false;
  }
};