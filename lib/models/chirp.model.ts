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
  createdAt: {
    type: Date,
    default: Date.now,
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
  hashtags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  mentions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: {
      type: String,
      required: true,
    },
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  shares: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'audio'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    filename: String,
    size: Number,
  }],
});

const Chirp = mongoose.models.Chirp || mongoose.model("Chirp", chirpSchema);

export default Chirp;
