import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: String,
  bio: String,
  email: String,
  website: String,
  location: String,
  dateOfBirth: Date,
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  // Follow request system for private accounts
  followRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  sentFollowRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  reportedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reason: String,
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  isPrivate: {
    type: Boolean,
    default: false,
  },
  chirps: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chirp",
    },
  ],
  onboarded: {
    type: Boolean,
    default: false,
  },
  communities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
  ],
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
