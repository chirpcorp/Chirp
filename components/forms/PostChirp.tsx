"use client";

import * as z from "zod";
import { useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useOrganization } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
import { extractHashtags, extractMentions } from "@/lib/utils";
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
import { getUsersByUsernames } from "@/lib/actions/mention.actions";

interface Props {
  userId: string;
  communityId?: string;
  placeholder?: string;
}

function PostChirp({ userId, communityId, placeholder }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [chirpText, setChirpText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreview, setFilePreview] = useState<string[]>([]);
  const { startUpload } = useUploadThing("media");

  const { organization } = useOrganization();

  const form = useForm({
    resolver: zodResolver(ChirpValidation),
    defaultValues: {
      chirp: "",
      accountId: JSON.parse(userId),
      hashtags: [],
      mentions: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof ChirpValidation>) => {
    // Extract hashtags and mentions from the text
    const hashtags = extractHashtags(values.chirp);
    const mentionUsernames = extractMentions(values.chirp);
    
    // Look up user IDs for mentions
    let mentions: { userId: string; username: string }[] = [];
    if (mentionUsernames.length > 0) {
      const users = await getUsersByUsernames(mentionUsernames);
      mentions = users.map((user: any) => ({
        userId: user._id.toString(),
        username: user.username,
      }));
    }

    // Handle file uploads
    let attachments: { type: string; url: string; filename?: string; size?: number }[] = [];
    if (files.length > 0) {
      const uploadedFiles = await startUpload(files);
      if (uploadedFiles) {
        attachments = uploadedFiles.map((file, index) => {
          const fileType = files[index].type;
          let attachmentType = 'document';
          
          if (fileType.startsWith('image/')) {
            attachmentType = fileType.includes('gif') ? 'gif' : 'image';
          } else if (fileType.startsWith('video/')) {
            attachmentType = 'video';
          } else if (fileType.startsWith('audio/')) {
            attachmentType = 'audio';
          }
          
          return {
            type: attachmentType,
            url: file.url,
            filename: files[index].name,
            size: files[index].size,
          };
        });
      }
    }

    await createChirp({
      text: values.chirp,
      author: userId,
      communityId: communityId || (organization ? organization.id : null),
      path: pathname,
      hashtags,
      mentions,
      attachments,
    });

    router.push("/");
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      // Create previews for images
      const previews: string[] = [];
      selectedFiles.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
              previews.push(result);
              setFilePreview([...previews]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = filePreview.filter((_, i) => i !== index);
    setFiles(newFiles);
    setFilePreview(newPreviews);
  };

  return (
    <Form {...form}>
      <form
        className='mt-10 flex flex-col justify-start gap-10'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name='chirp'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-light-2'>
                Content
              </FormLabel>
              <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1'>
                <Textarea 
                  rows={15} 
                  {...field}
                  placeholder={placeholder || "What's happening? Use #hashtags and @mentions"}
                  onChange={(e) => {
                    field.onChange(e);
                    setChirpText(e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
              {chirpText && (
                <div className='text-sm text-gray-400'>
                  {extractHashtags(chirpText).length > 0 && (
                    <div className='mb-1'>
                      <span className='text-blue-400'>Hashtags: </span>
                      {extractHashtags(chirpText).map((tag, index) => (
                        <span key={index} className='text-blue-500 mr-2'>#{tag}</span>
                      ))}
                    </div>
                  )}
                  {extractMentions(chirpText).length > 0 && (
                    <div>
                      <span className='text-green-400'>Mentions: </span>
                      {extractMentions(chirpText).map((mention, index) => (
                        <span key={index} className='mr-2 text-green-500'>@{mention}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </FormItem>
          )}
        />
        
        {/* File Upload Section */}
        <div className='flex flex-col gap-3'>
          <label className='text-base-semibold text-light-2'>
            Add Attachments
          </label>
          <div className='flex items-center gap-3'>
            <Input
              type='file'
              accept='image/*,audio/*,video/*,.pdf,.doc,.docx,.txt'
              multiple
              onChange={handleFileChange}
              className='account-form_image-input'
            />
            <span className='text-small-regular text-gray-1'>
              Images, videos, audio, or documents
            </span>
          </div>
          
          {/* File Previews */}
          {files.length > 0 && (
            <div className='mt-3 space-y-2'>
              {files.map((file, index) => (
                <div key={index} className='flex items-center gap-3 rounded-lg bg-dark-3 p-3'>
                  {file.type.startsWith('image/') && filePreview[index] ? (
                    <Image
                      src={filePreview[index]}
                      alt={`Preview ${index}`}
                      width={60}
                      height={60}
                      className='rounded object-cover'
                    />
                  ) : (
                    <div className='flex items-center gap-2'>
                      <Image src='/assets/attach.svg' alt='file' width={20} height={20} />
                      <span className='text-sm text-light-2'>
                        {file.type.startsWith('audio/') ? '🎵' : 
                         file.type.startsWith('video/') ? '🎬' : '📄'}
                      </span>
                    </div>
                  )}
                  <div className='flex-1'>
                    <p className='text-sm text-light-1'>{file.name}</p>
                    <p className='text-xs text-gray-1'>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={() => removeFile(index)}
                    className='text-red-500 hover:text-red-400'
                  >
                    <Image src='/assets/delete.svg' alt='remove' width={16} height={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type='submit' className='bg-primary-500'>
          Post Chirp
        </Button>
      </form>
    </Form>
  );
}

export default PostChirp;
