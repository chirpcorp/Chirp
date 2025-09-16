"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { formatDateString, parseTextContent } from "@/lib/utils";
import DeleteChirp from "../forms/DeleteChirp";
import SharePopup from "../shared/SharePopup";
import MediaGallery from "../shared/MediaGallery";
import { toggleLikeChirp, shareChirp } from "@/lib/actions/chirp.actions";

interface Props {
  id: string;
  currentUserId: string;
  parentId: string | null;
  content: string;
  author: {
    name: string;
    image: string;
    id: string;
    username?: string;
  };
  community: {
    id: string;
    name: string;
    image: string;
    username?: string;
    isPrivate?: boolean;
  } | null;
  createdAt: string;
  comments: {
    author: {
      image: string;
    };
  }[];
  hashtags?: string[];
  mentions?: { userId: string; username: string }[];
  communityTags?: { communityId: string; communityUsername: string }[];
  likes?: string[];
  shares?: string[];
  attachments?: {
    type: string;
    url: string;
    filename?: string;
    size?: number;
  }[];
  isComment?: boolean;
  isLikedByCurrentUser?: boolean;
}

function ChirpCard({
  id,
  currentUserId,
  parentId,
  content,
  author,
  community,
  createdAt,
  comments,
  hashtags = [],
  mentions = [],
  communityTags = [],
  likes = [],
  shares = [],
  attachments = [],
  isComment,
  isLikedByCurrentUser = false,
}: Props) {
  // Ensure all objects passed to client components are plain objects
  // Convert any potential MongoDB objects to plain objects
  const plainAuthor = {
    name: author.name,
    image: author.image,
    id: author.id,
    username: author.username || undefined,
  };
  
  const plainCommunity = community ? {
    id: community.id,
    name: community.name,
    image: community.image,
    username: community.username || undefined,
    isPrivate: community.isPrivate || undefined,
  } : null;
  
  // Fix potential infinite recursion by ensuring comments are properly processed
  const plainComments = Array.isArray(comments) ? comments.map(comment => ({
    author: {
      image: comment.author?.image || '',
    }
  })).filter(comment => comment.author.image) : [];
  
  const plainAttachments = Array.isArray(attachments) ? attachments.map(attachment => ({
    type: attachment.type,
    url: attachment.url,
    filename: attachment.filename || undefined,
    size: attachment.size || undefined,
  })) : [];

  const pathname = usePathname();
  const [isLiked, setIsLiked] = useState(isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(likes.length);
  const [shareCount, setShareCount] = useState(shares.length);
  const [isLoading, setIsLoading] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);

  const handleLike = async () => {
    setIsLoading(true);
    try {
      const path = pathname || ""; // Ensure pathname is a string, provide an empty string fallback if null
      const newLikeStatus = await toggleLikeChirp(id, currentUserId, path);
      setIsLiked(newLikeStatus);
      setLikeCount((prev: number) => newLikeStatus ? prev + 1 : prev - 1);
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const path = pathname || ""; // Ensure pathname is a string, provide an empty string fallback if null
      await shareChirp(id, currentUserId, path);
      setShareCount((prev: number) => prev + 1);
      
      // Show the share popup instead of simple alert
      setShowSharePopup(true);
    } catch (error) {
      console.error("Error sharing chirp:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article
      className={`flex w-full flex-col rounded-xl ${
        isComment ? "px-0 xs:px-4" : "bg-dark-2 p-4 xs:p-5"
      }`}
    >
      <div className='flex items-start justify-between'>
        <div className='flex w-full flex-1 flex-row gap-4'>
          {/* Facebook-style community header for community posts */}
          {plainCommunity && !isComment ? (
            <div className='flex w-full flex-col'>
              {/* Community Header */}
              <div className='mb-3 flex items-center gap-3'>
                <Link href={`/communities/${plainCommunity.username || plainCommunity.id}`} className='relative'>
                  <div className='relative size-10 xs:size-12'>
                    <Image
                      src={plainCommunity.image}
                      alt={plainCommunity.name}
                      fill
                      className='cursor-pointer rounded-lg object-cover' // Rounded square for community
                      unoptimized={true}
                    />
                    {plainCommunity.isPrivate && (
                      <div className='absolute -right-1 -top-1 rounded-full bg-gray-600 p-1'>
                        <Image src='/assets/lock.svg' alt='private' width={10} height={10} unoptimized={true} />
                      </div>
                    )}
                  </div>
                </Link>
                <div className='flex min-w-0 flex-col'>
                  <Link href={`/communities/${plainCommunity.username || plainCommunity.id}`} className='w-fit'>
                    <h3 className='cursor-pointer truncate text-base-semibold text-light-1 hover:underline'>
                      {plainCommunity.name}
                    </h3>
                  </Link>
                  <p className='truncate text-xs text-gray-1'>
                    {formatDateString(createdAt)}
                    {plainCommunity.isPrivate && ' • Private community'}
                  </p>
                </div>
              </div>
              
              {/* User info within community post */}
              <div className='ml-1 flex items-center gap-2 xs:ml-2 xs:gap-3'>
                <Link href={`/profile/${plainAuthor.id}`} className='relative size-7 xs:size-8'>
                  <Image
                    src={plainAuthor.image}
                    alt={plainAuthor.name}
                    fill
                    className='cursor-pointer rounded-full object-cover'
                    unoptimized={true}
                  />
                </Link>
                <div className='flex min-w-0 items-center gap-2'>
                  <Link href={`/profile/${plainAuthor.id}`} className='w-fit'>
                    <h4 className='cursor-pointer truncate text-small-semibold text-light-1 hover:underline'>
                      {plainAuthor.name}
                    </h4>
                  </Link>
                  {plainAuthor.username && (
                    <span className='truncate text-xs text-gray-1'>@{plainAuthor.username}</span>
                  )}
                </div>
              </div>
              
              {/* Content - SINGLE RENDERING */}
              <div className='ml-1 mt-2 xs:ml-2 xs:mt-3'>
                <div className='break-words text-small-regular text-light-2'>
                  {parseTextContent(content).map((part, index) => {
                    if (part.type === 'hashtag') {
                      return (
                        <Link
                          key={index}
                          href={part.href!}
                          className='font-semibold text-blue-400 hover:text-blue-300 hover:underline'
                        >
                          {part.content}
                        </Link>
                      );
                    } else if (part.type === 'mention') {
                      const username = part.content.slice(1);
                      const mentionUser = mentions.find(m => m.username === username);
                      return (
                        <Link
                          key={index}
                          href={mentionUser ? `/profile/${mentionUser.userId}` : `/search?q=${username}`}
                          className='font-semibold text-blue-400 hover:text-blue-300 hover:underline'
                        >
                          {part.content}
                        </Link>
                      );
                    } else if (part.type === 'community') {
                      const communityUsername = part.content.slice(2);
                      return (
                        <Link
                          key={index}
                          href={`/communities/${communityUsername}`}
                          className='font-semibold text-purple-400 hover:text-purple-300 hover:underline'
                        >
                          {part.content}
                        </Link>
                      );
                    } else if (part.type === 'url') {
                      return (
                        <a
                          key={index}
                          href={part.href!}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='break-all font-medium text-blue-400 hover:text-blue-300 hover:underline'
                        >
                          {part.content}
                        </a>
                      );
                    } else if (part.type === 'email') {
                      return (
                        <a
                          key={index}
                          href={part.href!}
                          className='font-medium text-blue-400 hover:text-blue-300 hover:underline'
                        >
                          {part.content}
                        </a>
                      );
                    } else {
                      return <span key={index}>{part.content}</span>;
                    }
                  })}
                </div>
              </div>
              
              {/* Media Gallery for community posts */}
              {plainAttachments && plainAttachments.length > 0 && (
                <div className="ml-1 mt-2 xs:ml-2 xs:mt-3">
                  <MediaGallery media={plainAttachments} className="max-h-80 xs:max-h-96" />
                </div>
              )}
              
              {/* Action buttons for community posts */}
              <div className='ml-1 mt-3 flex flex-col gap-2 xs:ml-2 xs:mt-5 xs:gap-3'>
                <div className='flex gap-2 xs:gap-3.5'>
                  {/* Like Button */}
                  <button 
                    onClick={handleLike}
                    disabled={isLoading}
                    className='flex cursor-pointer items-center gap-1 transition-transform hover:scale-105 disabled:opacity-50 xs:gap-2'
                  >
                    <Image
                      src={isLiked ? '/assets/heart-filled.svg' : '/assets/heart-gray.svg'}
                      alt='like'
                      width={20}
                      height={20}
                      className={`object-contain ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                      unoptimized={true}
                    />
                    {likeCount > 0 && <span className='text-small-medium text-gray-1'>{likeCount}</span>}
                  </button>
                  
                  {/* Repost Button (placeholder for now) */}
                  <Image
                    src='/assets/repost.svg'
                    alt='repost'
                    width={20}
                    height={20}
                    className='cursor-pointer object-contain transition-transform hover:scale-105'
                    unoptimized={true}
                  />
                  
                  {/* Share Button */}
                  <button 
                    onClick={handleShare}
                    disabled={isLoading}
                    className='flex cursor-pointer items-center gap-1 transition-transform hover:scale-105 disabled:opacity-50 xs:gap-2'
                  >
                    <Image
                      src='/assets/share.svg'
                      alt='share'
                      width={20}
                      height={20}
                      className='object-contain'
                      unoptimized={true}
                    />
                    {shareCount > 0 && <span className='text-small-medium text-gray-1'>{shareCount}</span>}
                  </button>
                  
                  {/* Delete Button */}
                  <button className='flex items-center justify-center transition-transform hover:scale-105' title='Delete'>
                    <Image
                      src='/assets/delete.svg'
                      alt='delete'
                      width={20}
                      height={20}
                      className='object-contain'
                      unoptimized={true}
                    />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Regular post layout (non-community or comment) */
              <>
              <div className='flex flex-col items-center'>
                <Link href={`/profile/${plainAuthor.id}`} className='relative size-10 xs:size-11'>
                  <Image
                    src={plainAuthor.image}
                    alt='user_community_image'
                    fill
                    className='cursor-pointer rounded-full'
                    unoptimized={true}
                  />
                </Link>

                {/* Removed the chirp-card_bar div to fix scrollbar issue */}
                {/* <div className='chirp-card_bar' /> */}
              </div>

              <div className='flex w-full min-w-0 flex-col'>
                <Link href={`/profile/${plainAuthor.id}`} className='w-fit'>
                  <h4 className='cursor-pointer truncate text-base-semibold text-light-1'>
                    {plainAuthor.name}
                  </h4>
                </Link>

                {/* Render content with embedded hashtags, mentions, links, and emails - SINGLE RENDERING */}
                <div className='mt-2 break-words text-small-regular text-light-2'>
                  {parseTextContent(content).map((part, index) => {
                    if (part.type === 'hashtag') {
                      return (
                        <Link
                          key={index}
                          href={part.href!}
                          className='font-semibold text-blue hover:text-cyan-300 hover:underline'
                        >
                          {part.content}
                        </Link>
                      );
                    } else if (part.type === 'mention') {
                      const username = part.content.slice(1);
                      const mentionUser = mentions.find(m => m.username === username);
                      return (
                        <Link
                          key={index}
                          href={mentionUser ? `/profile/${mentionUser.userId}` : `/search?q=${username}`}
                          className='font-semibold text-blue hover:text-cyan-300 hover:underline'
                        >
                          {part.content}
                        </Link>
                      );
                    } else if (part.type === 'community') {
                      const communityUsername = part.content.slice(2);
                      return (
                        <Link
                          key={index}
                          href={`/communities/${communityUsername}`}
                          className='font-semibold text-blue hover:text-cyan-300 hover:underline'
                        >
                          {part.content}
                        </Link>
                      );
                    } else if (part.type === 'url') {
                      return (
                        <a
                          key={index}
                          href={part.href!}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='break-all font-medium text-purple-400 hover:text-purple-300 hover:underline'
                        >
                          {part.content}
                        </a>
                      );
                    } else if (part.type === 'email') {
                      return (
                        <a
                          key={index}
                          href={part.href!}
                          className='font-medium text-blue hover:text-cyan-300 hover:underline'
                        >
                          {part.content}
                        </a>
                      );
                    } else {
                      return <span key={index}>{part.content}</span>;
                    }
                  })}
                </div>

                {/* Media Gallery */}
                {plainAttachments && plainAttachments.length > 0 && (
                  <div className="mt-2 xs:mt-3">
                    <MediaGallery media={plainAttachments} className="max-h-80 xs:max-h-96" />
                  </div>
                )}

                {/* Action buttons */}
                <div className={`${isComment && "mb-10"} mt-3 flex flex-col gap-2 xs:mt-5 xs:gap-3`}>
                  <div className='flex gap-2 xs:gap-3.5'>
                    {/* Like Button */}
                    <button 
                      onClick={handleLike}
                      disabled={isLoading}
                      className='flex cursor-pointer items-center gap-1 transition-transform hover:scale-105 disabled:opacity-50 xs:gap-2'
                    >
                      <Image
                        src={isLiked ? '/assets/heart-filled.svg' : '/assets/heart-gray.svg'}
                        alt='like'
                        width={20}
                        height={20}
                        className={`object-contain ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                        unoptimized={true}
                      />
                      {likeCount > 0 && <span className='text-small-medium text-gray-1'>{likeCount}</span>}
                    </button>
                    
                    {/* Reply Button */}
                    <Link href={`/chirp/${id}`} className='flex items-center gap-1 transition-transform hover:scale-105 xs:gap-2'>
                      <Image
                        src='/assets/reply.svg'
                        alt='reply'
                        width={20}
                        height={20}
                        className='cursor-pointer object-contain'
                        unoptimized={true}
                      />
                      {plainComments.length > 0 && <span className='text-small-medium text-gray-1'>{plainComments.length}</span>}
                    </Link>
                    
                    {/* Repost Button (placeholder for now) */}
                    <Image
                      src='/assets/repost.svg'
                      alt='repost'
                      width={20}
                      height={20}
                      className='cursor-pointer object-contain transition-transform hover:scale-105'
                      unoptimized={true}
                    />
                    
                    {/* Share Button */}
                    <button 
                      onClick={handleShare}
                      disabled={isLoading}
                      className='flex cursor-pointer items-center gap-1 transition-transform hover:scale-105 disabled:opacity-50 xs:gap-2'
                    >
                      <Image
                        src='/assets/share.svg'
                        alt='share'
                        width={20}
                        height={20}
                        className='object-contain'
                        unoptimized={true}
                      />
                      {shareCount > 0 && <span className='text-small-medium text-gray-1'>{shareCount}</span>}
                    </button>
                  </div>

                  {isComment && plainComments.length > 0 && (
                    <Link href={`/chirp/${id}`}>
                      <p className='mt-1 text-subtle-medium text-gray-1'>
                        {plainComments.length} repl{plainComments.length > 1 ? "ies" : "y"}
                      </p>
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}

          <DeleteChirp
            chirpId={JSON.stringify(id)}
            currentUserId={currentUserId}
            authorId={plainAuthor.id}
            parentId={parentId}
            isComment={isComment}
          />
        </div>
      </div>

      {/* Comments section for non-community posts */}
      {!isComment && !plainCommunity && plainComments.length > 0 && (
        <div className='ml-1 mt-2 flex items-center gap-1 xs:mt-3 xs:gap-2'>
          {plainComments.slice(0, 2).map((comment, index) => (
            <Image
              key={index}
              src={comment.author.image}
              alt={`user_${index}`}
              width={20}
              height={20}
              className={`${index !== 0 && "-ml-3 xs:-ml-5"} rounded-full object-cover`}
              unoptimized={true}
            />
          ))}

          <Link href={`/chirp/${id}`}>
            <p className='mt-1 text-subtle-medium text-gray-1'>
              {plainComments.length} repl{plainComments.length > 1 ? "ies" : "y"}
            </p>
          </Link>
        </div>
      )}

      {/* Show timestamp for non-community posts or comments */}
      {!isComment && !plainCommunity && (
        <div className='mt-3 flex items-center xs:mt-5'>
          <p className='text-subtle-medium text-gray-1'>
            {formatDateString(createdAt)}
          </p>
        </div>
      )}

      {/* Share Popup */}
      <SharePopup
        isOpen={showSharePopup}
        onClose={() => setShowSharePopup(false)}
        chirpUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/chirp/${id}`}
        chirpText={content}
        authorName={plainAuthor.name}
      />
    </article>
  );
}

export default ChirpCard;