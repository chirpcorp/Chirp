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
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 20000, // 20 seconds
      connectTimeoutMS: 10000, // 10 seconds
      maxIdleTimeMS: 30000, // 30 seconds
      retryWrites: true,
    });

    isConnected = true; // Set the connection status to true
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    isConnected = false; // Reset connection status on error
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
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