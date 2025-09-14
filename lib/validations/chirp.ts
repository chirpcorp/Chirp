import * as z from "zod";

export const MentionSchema = z.object({
  userId: z.string(),
  username: z.string().min(1, { message: "Username is required" }),
});

export const CommunityTagSchema = z.object({
  communityId: z.string(),
  communityUsername: z.string().min(1, { message: "Community username is required" }),
});

export const AttachmentSchema = z.object({
  type: z.string(),
  url: z.string(),
  filename: z.string().optional(),
  size: z.number().optional(),
});

export const ChirpValidation = z.object({
  chirp: z.string().nonempty().min(3, { message: "Minimum 3 characters." }),
  accountId: z.string(),
  hashtags: z.array(z.string()).optional().default([]),
  mentions: z.array(MentionSchema).optional().default([]),
  communityTags: z.array(CommunityTagSchema).optional().default([]),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export const CommentValidation = z.object({
  chirp: z.string().nonempty().min(3, { message: "Minimum 3 characters." }),
  hashtags: z.array(z.string()).default([]),
  mentions: z.array(MentionSchema).default([]),
  communityTags: z.array(CommunityTagSchema).default([]),
});