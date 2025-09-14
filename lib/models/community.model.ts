import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  username: {
    type: String,
    required: true,
    lowercase: true,
    maxlength: 50,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  image: {
    type: String,
    default: '/assets/community-default.svg',
  },
  coverImage: {
    type: String,
  },
  
  // Community creator (has special privileges)
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // Admins (can manage community but can't delete it)
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  
  // Moderators (can moderate content but limited admin rights)
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  
  // Community members
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member',
    }
  }],
  
  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false,
  },
  
  // Join requests for private communities
  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    message: {
      type: String,
      maxlength: 200,
    },
  }],
  
  // Community invitations
  invitations: [{
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
    },
  }],
  
  // Community chirps
  chirps: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chirp",
  }],
  
  // Community settings
  settings: {
    allowMemberPosts: {
      type: Boolean,
      default: true,
    },
    requireApprovalForPosts: {
      type: Boolean,
      default: false,
    },
    allowMemberInvites: {
      type: Boolean,
      default: true,
    },
    showMemberList: {
      type: Boolean,
      default: true,
    },
  },
  
  // Community stats
  stats: {
    totalPosts: {
      type: Number,
      default: 0,
    },
    totalMembers: {
      type: Number,
      default: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  
  // Community rules
  rules: [{
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
  }],
  
  // Tags for community categorization
  tags: [{
    type: String,
    maxlength: 30,
  }],
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
communitySchema.index({ username: 1 }, { unique: true });
communitySchema.index({ creator: 1 });
communitySchema.index({ 'members.user': 1 });
communitySchema.index({ isPrivate: 1 });
communitySchema.index({ tags: 1 });
communitySchema.index({ createdAt: -1 });

// Virtual for member count
communitySchema.virtual('memberCount').get(function() {
  return this.members && Array.isArray(this.members) ? this.members.length : 0;
});

// Virtual for admin list (includes creator)
communitySchema.virtual('allAdmins').get(function() {
  const adminIds = this.admins && Array.isArray(this.admins) ? [...this.admins] : [];
  // Add null safety check for creator
  if (this.creator && !adminIds.includes(this.creator)) {
    adminIds.push(this.creator);
  }
  return adminIds;
});

// Methods
communitySchema.methods.isMember = function(userId: string) {
  // Add null safety check
  if (!this.members || !Array.isArray(this.members)) return false;
  
  return this.members.some((member: any) => 
    member.user && member.user.toString() === userId.toString()
  );
};

communitySchema.methods.isAdmin = function(userId: string) {
  // Add null safety check for creator
  const isCreator = this.creator ? this.creator.toString() === userId.toString() : false;
  
  // Add null safety check for admins array
  const isAdmin = this.admins && Array.isArray(this.admins) 
    ? this.admins.some((adminId: any) => adminId && adminId.toString() === userId.toString())
    : false;
    
  return isCreator || isAdmin;
};

communitySchema.methods.isModerator = function(userId: string) {
  // Add null safety check for moderators array
  const isModerator = this.moderators && Array.isArray(this.moderators)
    ? this.moderators.some((modId: any) => modId && modId.toString() === userId.toString())
    : false;
    
  return isModerator || this.isAdmin(userId);
};

communitySchema.methods.isCreator = function(userId: string) {
  // Add null safety check
  return this.creator && this.creator.toString() === userId.toString();
};

communitySchema.methods.getMemberRole = function(userId: string) {
  // Add null safety checks
  if (!userId) return null;
  if (this.isCreator(userId)) return 'creator';
  if (this.isAdmin(userId)) return 'admin';
  if (this.isModerator(userId)) return 'moderator';
  if (this.isMember(userId)) return 'member';
  return null;
};

// Pre-save middleware to update stats
communitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  // Add null safety check
  // Add null safety check for stats object
  if (this.stats) {
    this.stats.totalMembers = (this.members && Array.isArray(this.members)) ? this.members.length : 0;
  }
  next();
});

const Community =
  mongoose.models.Community || mongoose.model("Community", communitySchema);

export default Community;