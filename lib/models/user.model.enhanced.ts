// Enhanced User Model with X-level features
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
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
  onboarded: {
    type: Boolean,
    default: false,
  },
  
  // Enhanced profile fields
  email: String,
  website: String,
  location: String,
  dateOfBirth: Date,
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  
  // Verification and status
  verified: {
    type: Boolean,
    default: false,
  },
  verificationBadge: {
    type: String,
    enum: ['none', 'blue', 'gold', 'business'],
    default: 'none'
  },
  accountType: {
    type: String,
    enum: ['personal', 'business', 'creator', 'organization'],
    default: 'personal'
  },
  
  // Privacy and security
  isPrivate: {
    type: Boolean,
    default: false,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  
  // Social connections
  chirps: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chirp",
    },
  ],
  communities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  
  // Advanced social features
  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  mutedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  reportedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  
  // Content preferences and interests
  interests: [String], // User's interests for algorithm
  contentPreferences: {
    showSensitiveContent: {
      type: Boolean,
      default: false,
    },
    allowDirectMessages: {
      type: String,
      enum: ['everyone', 'followers', 'none'],
      default: 'followers'
    },
    discoverability: {
      type: Boolean,
      default: true,
    }
  },
  
  // Engagement metrics
  metrics: {
    totalLikes: {
      type: Number,
      default: 0,
    },
    totalShares: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    engagementRate: {
      type: Number,
      default: 0,
    }
  },
  
  // Subscription and monetization
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    expiresAt: Date,
    features: [String] // Array of enabled features
  },
  
  // Professional features
  businessInfo: {
    companyName: String,
    industry: String,
    website: String,
    contactEmail: String,
  },
  
  // AI and personalization
  aiPreferences: {
    personalizedFeed: {
      type: Boolean,
      default: true,
    },
    contentRecommendations: {
      type: Boolean,
      default: true,
    },
    smartNotifications: {
      type: Boolean,
      default: true,
    }
  },
  
}, { 
  timestamps: true,
  // Add indexes for better performance
});

// Indexes for better query performance
userSchema.index({ id: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ verified: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ 'subscription.tier': 1 });

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// Methods
userSchema.methods.updateEngagementMetrics = async function() {
  // Calculate and update user's engagement metrics
  // This would be called periodically or after significant actions
};

userSchema.methods.isBlocked = function(userId: string) {
  return this.blockedUsers.includes(userId);
};

userSchema.methods.isMuted = function(userId: string) {
  return this.mutedUsers.includes(userId);
};

userSchema.methods.canReceiveMessages = function(fromUserId: string) {
  if (this.contentPreferences.allowDirectMessages === 'none') return false;
  if (this.contentPreferences.allowDirectMessages === 'everyone') return true;
  return this.followers.includes(fromUserId);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;