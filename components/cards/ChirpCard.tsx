"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import { formatDateString, parseTextContent } from "@/lib/utils";
import DeleteChirp from "../forms/DeleteChirp";
import SharePopup from "../shared/SharePopup";
import MediaGallery from "../shared/MediaGallery";
import { toggleLikeChirp, shareChirp } from "@/lib/actions/chirp.actions";
import { fetchUser } from "@/lib/actions/user.actions";

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
  const pathname = usePathname();
  const [isLiked, setIsLiked] = useState(isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(likes.length);
  const [shareCount, setShareCount] = useState(shares.length);
  const [isLoading, setIsLoading] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [chirpUrl, setChirpUrl] = useState("");

  useEffect(() => {
    setChirpUrl(`${window.location.origin}/chirp/${id}`);
  }, [id]);

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
        isComment ? "px-0 xs:px-7" : "bg-dark-2 p-7"
      }`}
    >
      <div className='flex items-start justify-between'>
        <div className='flex w-full flex-1 flex-row gap-4'>
          {/* Facebook-style community header for community posts */}
          {community && !isComment ? (
            <div className='flex flex-col w-full'>
              {/* Community Header */}
              <div className='flex items-center gap-3 mb-3'>
                <Link href={`/communities/${community.username || community.id}`} className='relative'>
                  <div className='relative h-12 w-12'>
                    <Image
                      src={community.image}
                      alt={community.name}
                      fill
                      className='cursor-pointer rounded-lg object-cover' // Rounded square for community
                      unoptimized={true}
                    />
                    {community.isPrivate && (
                      <div className='absolute -top-1 -right-1 bg-gray-600 rounded-full p-1'>
                        <Image src='/assets/lock.svg' alt='private' width={10} height={10} unoptimized={true} />
                      </div>
                    )}
                  </div>
                </Link>
                <div className='flex flex-col'>
                  <Link href={`/communities/${community.username || community.id}`} className='w-fit'>
                    <h3 className='cursor-pointer text-base-semibold text-light-1 hover:underline'>
                      {community.name}
                    </h3>
                  </Link>
                  <p className='text-xs text-gray-1'>
                    {formatDateString(createdAt)}
                    {community.isPrivate && ' • Private community'}
                  </p>
                </div>
              </div>
              
              {/* User info within community post */}
              <div className='flex items-center gap-3 ml-2'>
                <Link href={`/profile/${author.id}`} className='relative h-8 w-8'>
                  <Image
                    src={author.image}
                    alt={author.name}
                    fill
                    className='cursor-pointer rounded-full object-cover'
                    unoptimized={true}
                  />
                </Link>
                <div className='flex items-center gap-2'>
                  <Link href={`/profile/${author.id}`} className='w-fit'>
                    <h4 className='cursor-pointer text-small-semibold text-light-1 hover:underline'>
                      {author.name}
                    </h4>
                  </Link>
                  {author.username && (
                    <span className='text-xs text-gray-1'>@{author.username}</span>
                  )}
                </div>
              </div>
              
              {/* Content - SINGLE RENDERING */}
              <div className='ml-2 mt-3'>
                <div className='text-small-regular text-light-2'>
                  {parseTextContent(content).map((part, index) => {
                    if (part.type === 'hashtag') {
                      return (
                        <Link
                          key={index}
                          href={part.href!}
                          className='text-blue-400 font-semibold hover:text-blue-300 hover:underline'
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
                          className='text-blue-400 font-semibold hover:text-blue-300 hover:underline'
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
                          className='text-purple-400 font-semibold hover:text-purple-300 hover:underline'
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
                          className='text-blue-400 font-medium hover:text-blue-300 hover:underline break-all'
                        >
                          {part.content}
                        </a>
                      );
                    } else if (part.type === 'email') {
                      return (
                        <a
                          key={index}
                          href={part.href!}
                          className='text-blue-400 font-medium hover:text-blue-300 hover:underline'
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
              {attachments && attachments.length > 0 && (
                <div className="ml-2 mt-3">
                  <MediaGallery media={attachments} className="max-h-96" />
                </div>
              )}
              
              {/* Action buttons for community posts */}
              <div className='ml-2 mt-5 flex flex-col gap-3'>
                <div className='flex gap-3.5'>
                  {/* Like Button */}
                  <button 
                    onClick={handleLike}
                    disabled={isLoading}
                    className='flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform disabled:opacity-50'
                  >
                    <Image
                      src={isLiked ? '/assets/heart-filled.svg' : '/assets/heart-gray.svg'}
                      alt='like'
                      width={24}
                      height={24}
                      className={`object-contain ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                      unoptimized={true}
                    />
                    {likeCount > 0 && <span className='text-small-medium text-gray-1'>{likeCount}</span>}
                  </button>
                  
                  {/* Reply Button */}
                  <Link href={`/chirp/${id}`} className='flex items-center gap-2 hover:scale-105 transition-transform'>
                    <Image
                      src='/assets/reply.svg'
                      alt='reply'
                      width={24}
                      height={24}
                      className='cursor-pointer object-contain'
                      unoptimized={true}
                    />
                    {comments.length > 0 && <span className='text-small-medium text-gray-1'>{comments.length}</span>}
                  </Link>
                  
                  {/* Repost Button (placeholder for now) */}
                  <Image
                    src='/assets/repost.svg'
                    alt='repost'
                    width={24}
                    height={24}
                    className='cursor-pointer object-contain hover:scale-105 transition-transform'
                    unoptimized={true}
                  />
                  
                  {/* Share Button */}
                  <button 
                    onClick={handleShare}
                    disabled={isLoading}
                    className='flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform disabled:opacity-50'
                  >
                    <Image
                      src='/assets/share.svg'
                      alt='share'
                      width={24}
                      height={24}
                      className='object-contain'
                      unoptimized={true}
                    />
                    {shareCount > 0 && <span className='text-small-medium text-gray-1'>{shareCount}</span>}
                    {/* Delete Button */}
                    <button className='flex items-center justify-center hover:scale-105 transition-transform' title='Delete'>
                      <Image
                        src='/assets/delete.svg'
                        alt='delete'
                        width={22}
                        height={22}
                        className='object-contain'
                        unoptimized={true}
                      />
                    </button>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Regular post layout (non-community or comment) */
              <>
              <div className='flex flex-col items-center'>
                <Link href={`/profile/${author.id}`} className='relative h-11 w-11'>
                  <Image
                    src={author.image}
                    alt='user_community_image'
                    fill
                    className='cursor-pointer rounded-full'
                    unoptimized={true}
                  />
                </Link>

                {/* Removed the chirp-card_bar div to fix scrollbar issue */}
                {/* <div className='chirp-card_bar' /> */}
              </div>

              <div className='flex w-full flex-col'>
                <Link href={`/profile/${author.id}`} className='w-fit'>
                  <h4 className='cursor-pointer text-base-semibold text-light-1'>
                    {author.name}
                  </h4>
                </Link>

                {/* Render content with embedded hashtags, mentions, links, and emails - SINGLE RENDERING */}
                <div className='mt-2 text-small-regular text-light-2'>
                  {parseTextContent(content).map((part, index) => {
                    if (part.type === 'hashtag') {
                      return (
                        <Link
                          key={index}
                          href={part.href!}
                          className='text-blue font-semibold hover:text-cyan-300 hover:underline'
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
                          className='text-blue font-semibold hover:text-cyan-300 hover:underline'
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
                          className='text-blue font-semibold hover:text-cyan-300 hover:underline'
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
                          className='text-purple-400 font-medium hover:text-purple-300 hover:underline break-all'
                        >
                          {part.content}
                        </a>
                      );
                    } else if (part.type === 'email') {
                      return (
                        <a
                          key={index}
                          href={part.href!}
                          className='text-blue font-medium hover:text-cyan-300 hover:underline'
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
                {attachments && attachments.length > 0 && (
                  <div className="mt-3">
                    <MediaGallery media={attachments} className="max-h-96" />
                  </div>
                )}

                {/* Action buttons */}
                <div className={`${isComment && "mb-10"} mt-5 flex flex-col gap-3`}>
                  <div className='flex gap-3.5'>
                    {/* Like Button */}
                    <button 
                      onClick={handleLike}
                      disabled={isLoading}
                      className='flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform disabled:opacity-50'
                    >
                      <Image
                        src={isLiked ? '/assets/heart-filled.svg' : '/assets/heart-gray.svg'}
                        alt='like'
                        width={24}
                        height={24}
                        className={`object-contain ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                        unoptimized={true}
                      />
                      {likeCount > 0 && <span className='text-small-medium text-gray-1'>{likeCount}</span>}
                    </button>
                    
                    {/* Reply Button */}
                    <Link href={`/chirp/${id}`} className='flex items-center gap-2 hover:scale-105 transition-transform'>
                      <Image
                        src='/assets/reply.svg'
                        alt='reply'
                        width={24}
                        height={24}
                        className='cursor-pointer object-contain'
                        unoptimized={true}
                      />
                      {comments.length > 0 && <span className='text-small-medium text-gray-1'>{comments.length}</span>}
                    </Link>
                    
                    {/* Repost Button (placeholder for now) */}
                    <Image
                      src='/assets/repost.svg'
                      alt='repost'
                      width={24}
                      height={24}
                      className='cursor-pointer object-contain hover:scale-105 transition-transform'
                      unoptimized={true}
                    />
                    
                    {/* Share Button */}
                    <button 
                      onClick={handleShare}
                      disabled={isLoading}
                      className='flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform disabled:opacity-50'
                    >
                      <Image
                        src='/assets/share.svg'
                        alt='share'
                        width={24}
                        height={24}
                        className='object-contain'
                        unoptimized={true}
                      />
                      {shareCount > 0 && <span className='text-small-medium text-gray-1'>{shareCount}</span>}
                    </button>
                  </div>

                  {isComment && comments.length > 0 && (
                    <Link href={`/chirp/${id}`}>
                      <p className='mt-1 text-subtle-medium text-gray-1'>
                        {comments.length} repl{comments.length > 1 ? "ies" : "y"}
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
            authorId={author.id}
            parentId={parentId}
            isComment={isComment}
          />
        </div>
      </div>

      {/* Comments section for non-community posts */}
      {!isComment && !community && comments.length > 0 && (
        <div className='ml-1 mt-3 flex items-center gap-2'>
          {comments.slice(0, 2).map((comment, index) => (
            <Image
              key={index}
              src={comment.author.image}
              alt={`user_${index}`}
              width={24}
              height={24}
              className={`${index !== 0 && "-ml-5"} rounded-full object-cover`}
              unoptimized={true}
            />
          ))}

          <Link href={`/chirp/${id}`}>
            <p className='mt-1 text-subtle-medium text-gray-1'>
              {comments.length} repl{comments.length > 1 ? "ies" : "y"}
            </p>
          </Link>
        </div>
      )}

      {/* Show timestamp for non-community posts or comments */}
      {!isComment && !community && (
        <div className='mt-5 flex items-center'>
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
        authorName={author.name}
      />
    </article>
  );
}

export default ChirpCard;
