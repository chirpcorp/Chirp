"use client";

import * as z from "zod";
import { useState, ChangeEvent, useRef } from "react";
import { useForm } from "react-hook-form";
import { useOrganization } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
import { isBase64Image } from "@/lib/utils";
import Image from "next/image";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { ChirpValidation } from "@/lib/validations/chirp";
import { createChirp } from "@/lib/actions/chirp.actions";
import { extractHashtags, extractMentions, extractCommunityReferences } from "@/lib/utils";
import { getUsersByUsernames } from "@/lib/actions/mention.actions";
import { getCommunitiesByUsernames } from "@/lib/actions/community.actions";
import { moderateContent } from "@/lib/algorithms/recommendation";

interface Props {
  userId: string;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
}

function EnhancedPostChirp({ userId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [chirpText, setChirpText] = useState("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mentions, setMentions] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const { startUpload, isUploading } = useUploadThing("media", {
    onClientUploadComplete: (res) => {
      console.log("Files uploaded successfully:", res);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      console.error("Upload error details:", {
        message: error.message,
        name: error.name,
        cause: error.cause,
        digest: error.digest
      });
      setError(`Upload failed: ${error.message}`);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onBeforeUploadBegin: (files) => {
      console.log("Starting upload for files:", files);
      return files;
    },
  });
  
  const { organization } = useOrganization();

  const form = useForm({
    resolver: zodResolver(ChirpValidation),
    defaultValues: {
      chirp: "",
      accountId: JSON.parse(userId),
      hashtags: [],
      mentions: [],
      communityTags: [],
      attachments: [],
    },
  });

  const characterLimit = 280;
  const remainingChars = characterLimit - chirpText.length;

  const onSubmit = async (values: z.infer<typeof ChirpValidation>) => {
    try {
      setIsLoading(true);
      setError("");

      // Content moderation check
      const moderationResult = await moderateContent(
        values.chirp, 
        files.map(f => ({ type: f.file.type, size: f.file.size }))
      );
      
      if (!moderationResult.isAppropriate) {
        setError("Content violates community guidelines. Please revise and try again.");
        return;
      }

      // Check video durations before upload
      const videoFiles = files.filter(f => f.file.type.startsWith('video/'));
      for (const fileWithPreview of videoFiles) {
        const duration = await getVideoDuration(fileWithPreview.file);
        if (duration > 15 * 60) { // 15 minutes in seconds
          setError("One or more videos exceed the 15-minute limit.");
          return;
        }
      }

      // Extract hashtags, mentions, and community references from the text
      const hashtags = extractHashtags(values.chirp);
      const mentionUsernames = extractMentions(values.chirp);
      const communityReferences = extractCommunityReferences(values.chirp);
      
      // Look up user IDs for mentions
      let mentionsList: { userId: string; username: string }[] = [];
      if (mentionUsernames.length > 0) {
        const users = await getUsersByUsernames(mentionUsernames);
        mentionsList = users.map((user: any) => ({
          userId: user._id.toString(),
          username: user.username,
        }));
      }
      
      // Look up community IDs for community tags
      let communityTagsList: { communityId: string; communityUsername: string }[] = [];
      if (communityReferences.length > 0) {
        const communities = await getCommunitiesByUsernames(communityReferences);
        communityTagsList = communities.map((community: any) => ({
          communityId: community._id.toString(),
          communityUsername: community.username,
        }));
      }

      // Handle file uploads
      let attachments: { type: string; url: string; filename?: string; size?: number }[] = [];
      if (files.length > 0) {
        console.log("Starting file upload for", files.length, "files");
        
        try {
          const filesToUpload = files.map(f => f.file);
          console.log("Files to upload:", filesToUpload);
          
          const uploadedFiles = await startUpload(filesToUpload);
          console.log("Upload response:", uploadedFiles);
          
          if (uploadedFiles && uploadedFiles.length > 0) {
            console.log("Upload successful:", uploadedFiles);
            
            attachments = uploadedFiles.map((uploadedFile, index) => {
              const originalFile = files[index];
              const fileType = originalFile.file.type;
              let attachmentType = 'document'; // default
              
              if (fileType.startsWith('image/')) {
                attachmentType = fileType.includes('gif') ? 'gif' : 'image';
              } else if (fileType.startsWith('video/')) {
                attachmentType = 'video';
              } else if (fileType.startsWith('audio/')) {
                attachmentType = 'audio';
              } else if (fileType.includes('pdf') || fileType.includes('doc') || fileType.includes('txt')) {
                attachmentType = 'document';
              }
              
              return {
                type: attachmentType,
                url: uploadedFile.url,
                filename: originalFile.file.name,
                size: originalFile.file.size,
              };
            });
            
            console.log("Processed attachments:", attachments);
          } else {
            console.warn("No files were uploaded successfully");
          }
        } catch (uploadError: any) {
          console.error("File upload failed:", uploadError);
          console.error("File upload error details:", {
            message: uploadError.message,
            stack: uploadError.stack,
            name: uploadError.name
          });
          setError(`File upload failed: ${uploadError.message}`);
          return;
        }
      }

      console.log("Creating chirp with attachments:", attachments);

      const newChirp = await createChirp({
        text: values.chirp,
        author: JSON.parse(userId), // Use parsed userId
        communityId: organization ? organization.id : null,
        path: pathname,
        hashtags: hashtags,
        mentions: mentionsList,
        communityTags: communityTagsList,
        attachments: attachments,
      });

      console.log("Chirp created successfully:", newChirp);

      // Reset form
      form.reset();
      setChirpText("");
      setFiles([]);
      setUploadProgress(0);
      router.push("/");
    } catch (error: any) {
      console.error("Error creating chirp:", error);
      setError(error.message || "Failed to post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const position = e.target.selectionStart;
    
    setChirpText(text);
    setCursorPosition(position);
    
    // Check for mentions
    const words = text.split(' ');
    const currentWord = words.find(word => 
      text.slice(0, position).endsWith(word) && word.startsWith('@')
    );
    
    if (currentWord && currentWord.length > 1) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
    
    // Update all form fields
    form.setValue("chirp", text);
    form.setValue("hashtags", extractHashtags(text));
    const mentionUsernames = extractMentions(text);
    form.setValue("mentions", mentionUsernames.map(username => ({ userId: "", username })));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Check file size limits (16MB per file)
      const oversizedFiles = selectedFiles.filter(file => file.size > 16 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError("Some files are too large. Max size is 16MB per file.");
        return;
      }

      // Check total file limit
      const totalFiles = files.length + selectedFiles.length;
      if (totalFiles > 10) {
        setError("Maximum 10 files allowed per post.");
        return;
      }
      
      // Check video duration for video files
      const videoFiles = selectedFiles.filter(file => file.type.startsWith('video/'));
      if (videoFiles.length > 0) {
        checkVideoDurations(videoFiles);
      }
      
      // Create file objects with previews
      const newFiles: FileWithPreview[] = selectedFiles.map(file => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fileWithPreview: FileWithPreview = {
          file,
          id,
        };

        // Create preview for images and videos
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
              // Use functional update to ensure we're working with the latest state
              setFiles(prevFiles => {
                // Check if the file still exists in state (it might have been removed)
                if (!prevFiles.some(f => f.id === id)) {
                  return prevFiles;
                }
                
                // Update the file with the preview
                return prevFiles.map(f => 
                  f.id === id ? { ...f, preview: result } : f
                );
              });
            }
          };
          reader.readAsDataURL(file);
        }

        return fileWithPreview;
      });
      
      setFiles(prev => [...prev, ...newFiles]);
      setError(""); // Clear any previous errors
    }
  };

  const checkVideoDurations = (videoFiles: File[]) => {
    videoFiles.forEach(file => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        if (duration > 15 * 60) { // 15 minutes in seconds
          setError("Video length exceeds 15 minutes limit.");
          // Remove the file from the input
          setFiles(prev => prev.filter(f => f.file !== file));
        }
        // Clean up the object URL
        if (video.src) {
          window.URL.revokeObjectURL(video.src);
        }
      };
      
      video.onerror = () => {
        console.error("Error loading video metadata");
        // Clean up the object URL
        if (video.src) {
          window.URL.revokeObjectURL(video.src);
        }
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        // Clean up the object URL
        if (video.src) {
          window.URL.revokeObjectURL(video.src);
        }
        resolve(duration);
      };
      
      video.onerror = () => {
        // Clean up the object URL
        if (video.src) {
          window.URL.revokeObjectURL(video.src);
        }
        reject(new Error("Failed to load video metadata"));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const removeFile = (id: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== id));
  };

  const saveDraft = () => {
    setIsDraft(true);
    localStorage.setItem('chirp-draft', JSON.stringify({
      text: chirpText,
      files: files.map(f => ({ name: f.file.name, size: f.file.size, type: f.file.type })),
      timestamp: Date.now()
    }));
    setError("");
    
    // Auto-hide draft message after 3 seconds
    setTimeout(() => setIsDraft(false), 3000);
  };

  const insertEmoji = (emoji: string) => {
    const newText = chirpText.slice(0, cursorPosition) + emoji + chirpText.slice(cursorPosition);
    setChirpText(newText);
    form.setValue("chirp", newText);
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
    }
  };

  const renderFilePreview = (fileWithPreview: FileWithPreview, index: number) => {
    const { file, preview, id } = fileWithPreview;
    
    return (
      <div key={id} className='relative bg-dark-3 rounded-lg p-3'>
        {file.type.startsWith('image/') && preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt={`Preview ${index}`}
              width={150}
              height={150}
              className='rounded object-cover w-full h-32'
            />
            <button
              type='button'
              onClick={() => removeFile(id)}
              className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors'
            >
              ×
            </button>
          </div>
        ) : file.type.startsWith('video/') && preview ? (
          <div className="relative">
            <video
              src={preview}
              className='rounded w-full h-32 object-cover'
              controls
            />
            <button
              type='button'
              onClick={() => removeFile(id)}
              className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors'
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-2xl">
              {file.type.startsWith('audio/') ? '🎵' : 
               file.type.includes('pdf') ? '📄' : 
               file.type.includes('doc') ? '📝' : '📎'}
            </div>
            <div className="flex-1 min-w-0">
              <p className='text-sm text-light-1 truncate'>{file.name}</p>
              <p className='text-xs text-gray-1'>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type='button'
              onClick={() => removeFile(id)}
              className='text-red-500 hover:text-red-400 flex-shrink-0 transition-colors'
            >
              ×
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-dark-2 rounded-xl p-6 border border-dark-4">
      <Form {...form}>
        <form
          className='flex flex-col gap-6'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-dark-3 rounded-full"></div>
            <div>
              <p className="text-body-semibold text-light-1">What's happening?</p>
              <p className="text-small-regular text-gray-1">
                Share your thoughts with the community
              </p>
            </div>
          </div>

          {/* Main text area */}
          <FormField
            control={form.control}
            name='chirp'
            render={({ field }) => (
              <FormItem className='relative'>
                <FormControl>
                  <Textarea 
                    ref={textareaRef}
                    rows={4} 
                    value={chirpText}
                    onChange={handleTextChange}
                    placeholder="What's happening? Use #hashtags, @mentions, and c/communities"
                    className="no-focus border-none bg-transparent text-light-1 text-lg resize-none placeholder:text-gray-1"
                    style={{ minHeight: '120px' }}
                    disabled={isLoading}
                  />
                </FormControl>
                
                {/* Character counter */}
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <div className={`text-small-medium ${
                    remainingChars < 20 ? 'text-red-500' : 
                    remainingChars < 50 ? 'text-yellow-500' : 
                    'text-gray-1'
                  }`}>
                    {remainingChars}
                  </div>
                  <div className="w-8 h-8 relative">
                    <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        className="text-dark-4"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 14}`}
                        strokeDashoffset={`${2 * Math.PI * 14 * (remainingChars / characterLimit)}`}
                        className={`transition-all duration-300 ${
                          remainingChars < 20 ? 'text-red-500' : 
                          remainingChars < 50 ? 'text-yellow-500' : 
                          'text-primary-500'
                        }`}
                      />
                    </svg>
                  </div>
                </div>
                
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="w-full bg-dark-3 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
              <p className="text-xs text-gray-1 mt-1">Uploading files... {uploadProgress}%</p>
            </div>
          )}

          {/* Hashtags, mentions, and community references preview */}
          {chirpText && (
            <div className='text-sm space-y-2'>
              {extractHashtags(chirpText).length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  <span className='text-blue-400'>Hashtags:</span>
                  {extractHashtags(chirpText).map((tag, index) => (
                    <span key={index} className='bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs'>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {extractMentions(chirpText).length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  <span className='text-green-400'>Mentions:</span>
                  {extractMentions(chirpText).map((mention, index) => (
                    <span key={index} className='bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs'>
                      @{mention}
                    </span>
                  ))}
                </div>
              )}
              {extractCommunityReferences(chirpText).length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  <span className='text-purple-400'>Communities:</span>
                  {extractCommunityReferences(chirpText).map((community, index) => (
                    <span key={index} className='bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs'>
                      c/{community}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* File previews */}
          {files.length > 0 && (
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {files.map((fileWithPreview, index) => renderFilePreview(fileWithPreview, index))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between border-t border-dark-4 pt-4">
            <div className="flex items-center gap-4">
              {/* File upload */}
              <label className={`cursor-pointer hover:bg-dark-3 p-2 rounded-full transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Image src='/assets/attach.svg' alt='attach' width={20} height={20} />
                <Input
                  type='file'
                  accept='image/*,audio/*,video/*,.pdf,.doc,.docx,.txt'
                  multiple
                  onChange={handleFileChange}
                  className='hidden'
                  disabled={isLoading}
                />
              </label>
              
              {/* Emoji picker */}
              <div className="flex gap-1">
                {['😀', '😂', '❤️', '👍', '🔥', '💯'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="hover:bg-dark-3 p-1 rounded transition-colors text-lg disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              {/* Poll option (placeholder) */}
              {/**
               * <button
                type="button"
                className="hover:bg-dark-3 p-2 rounded-full transition-colors disabled:opacity-50"
                title="Create poll (coming soon)"
                disabled={isLoading}
              >
                📊
              </button>
               */}
            </div>

            <div className="flex items-center gap-3">
              {/* Draft button */}
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                className="text-gray-1 border-dark-4 hover:bg-dark-3"
                disabled={isLoading}
              >
                Save Draft
              </Button>
              
              {/* Submit button */}
              <Button 
                type='submit' 
                disabled={isLoading || !chirpText.trim() || remainingChars < 0 || isUploading}
                className='bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading || isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isUploading ? 'Uploading...' : 'Posting...'}
                  </div>
                ) : (
                  'Post Chirp'
                )}
              </Button>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className='bg-red-500/10 border border-red-500 rounded-lg p-3'>
              <p className='text-red-400 text-sm'>{error}</p>
            </div>
          )}
          
          {/* Draft saved message */}
          {isDraft && (
            <div className='bg-green-500/10 border border-green-500 rounded-lg p-3'>
              <p className='text-green-400 text-sm'>Draft saved successfully!</p>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}

export default EnhancedPostChirp;