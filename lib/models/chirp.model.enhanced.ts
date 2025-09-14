// Enhanced Chirp Model with X-level features
import mongoose from "mongoose";

const chirpSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
  parentId: {
    type: String,
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chirp",
    },
  ],
  
  // Enhanced content features
  hashtags: [String],
  mentions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  }],
  
  // Community tags (for group-like functionality)
  communityTags: [{
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community"
    },
    communityUsername: String
  }],
  
  // Media and attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'gif', 'document', 'link'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: String,
    size: Number,
    duration: Number, // For video/audio
    dimensions: {
      width: Number,
      height: Number
    },
    thumbnail: String, // For videos
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Link preview
  linkPreview: {
    url: String,
    title: String,
    description: String,
    image: String,
    domain: String
  },
  
  // Engagement metrics
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  shares: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    duration: Number // How long they viewed
  }],
  
  // Advanced features
  isPinned: {
    type: Boolean,
    default: false
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotionBudget: Number,
  
  // Content moderation
  moderation: {
    status: {
      type: String,
      enum: ['approved', 'pending', 'flagged', 'removed'],
      default: 'approved'
    },
    flags: [{
      type: {
        type: String,
        enum: ['spam', 'inappropriate', 'misleading', 'harassment']
      },
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: Date,
    autoModerated: {
      type: Boolean,
      default: false
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  
  // Privacy and visibility
  visibility: {
    type: String,
    enum: ['public', 'followers', 'mentioned', 'circle'],
    default: 'public'
  },
  allowReplies: {
    type: String,
    enum: ['everyone', 'followers', 'mentioned', 'none'],
    default: 'everyone'
  },
  
  // Scheduling and publishing
  scheduledFor: Date,
  publishedAt: {
    type: Date,
    default: Date.now
  },
  editHistory: [{
    editedAt: {
      type: Date,
      default: Date.now
    },
    previousText: String,
    reason: String
  }],
  
  // Location and context
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
    name: String, // Location name
    placeId: String // Google Places ID or similar
  },
  
  // Sentiment and AI analysis
  aiAnalysis: {
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
    },
    topics: [String],
    language: String,
    toxicityScore: {
      type: Number,
      min: 0,
      max: 1
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  
  // Thread and conversation
  threadId: String, // For grouping related chirps
  isThreadStart: {
    type: Boolean,
    default: false
  },
  threadPosition: Number,
  
  // Monetization
  monetization: {
    isMonetized: {
      type: Boolean,
      default: false
    },
    revenue: {
      type: Number,
      default: 0
    },
    tips: [{
      amount: Number,
      currency: String,
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      tippedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Performance metrics
  performance: {
    impressions: {
      type: Number,
      default: 0
    },
    reach: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    },
    viralityScore: {
      type: Number,
      default: 0
    },
    peakHour: Number // Hour when most engagement occurred
  }
  
}, { 
  timestamps: true 
});

// Indexes for performance
chirpSchema.index({ author: 1, createdAt: -1 });
chirpSchema.index({ parentId: 1 });
chirpSchema.index({ hashtags: 1 });
chirpSchema.index({ 'mentions.userId': 1 });
chirpSchema.index({ createdAt: -1 });
chirpSchema.index({ 'performance.viralityScore': -1 });
chirpSchema.index({ 'moderation.status': 1 });
chirpSchema.index({ visibility: 1 });

// Geospatial index for location-based queries
chirpSchema.index({ location: '2dsphere' });

// Text search index
chirpSchema.index({ 
  text: 'text', 
  'hashtags': 'text',
  'aiAnalysis.topics': 'text'
});

// Virtual fields
chirpSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

chirpSchema.virtual('shareCount').get(function() {
  return this.shares ? this.shares.length : 0;
});

chirpSchema.virtual('replyCount').get(function() {
  return this.children ? this.children.length : 0;
});

chirpSchema.virtual('totalEngagement').get(function() {
  return (this.likes?.length || 0) + (this.shares?.length || 0) + (this.children?.length || 0);
});

// Methods
chirpSchema.methods.calculateEngagementRate = function() {
  const totalEngagement = this.totalEngagement;
  const impressions = this.performance.impressions || 1;
  return totalEngagement / impressions;
};

chirpSchema.methods.isLikedBy = function(userId: string) {
  return this.likes.includes(userId);
};

chirpSchema.methods.isSharedBy = function(userId: string) {
  return this.shares.includes(userId);
};

chirpSchema.methods.canReply = function(userId: string, userFollowers: string[]) {
  switch (this.allowReplies) {
    case 'none':
      return false;
    case 'everyone':
      return true;
    case 'followers':
      return userFollowers.includes(this.author.toString());
    case 'mentioned':
      return this.mentions.some((mention: any) => mention.userId.toString() === userId);
    default:
      return true;
  }
};

// Pre-save middleware
chirpSchema.pre('save', function(next) {
  // Update engagement rate before saving
  if (this.isModified('likes') || this.isModified('shares') || this.isModified('children')) {
    if (this.performance) {
      const totalEngagement = (this.likes?.length || 0) + (this.shares?.length || 0) + (this.children?.length || 0);
      const impressions = this.performance.impressions || 1;
      this.performance.engagementRate = totalEngagement / impressions;
    }
  }
  next();
});

const Chirp = mongoose.models.Chirp || mongoose.model("Chirp", chirpSchema);

export default Chirp;