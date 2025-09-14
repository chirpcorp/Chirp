"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

interface User {
  _id: string;
  id: string;
  name: string;
  username: string;
  image: string;
  bio?: string;
  verified?: boolean;
  suggestionScore?: number;
  mutualFollows?: number;
}

interface Props {
  users: User[];
}

export function SuggestedUsers({ users }: Props) {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const handleFollow = async (userId: string) => {
    setLoadingIds(prev => new Set(prev).add(userId));
    
    try {
      // Call follow API
      // await followUser(currentUserId, userId, pathname);
      
      setFollowingIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setLoadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const isFollowing = (userId: string) => followingIds.has(userId);
  const isLoading = (userId: string) => loadingIds.has(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-heading3-bold text-light-1">
          Who to follow
        </h2>
        <Link 
          href="/explore?tab=people" 
          className="text-small-medium text-primary-500 hover:underline"
        >
          See all
        </Link>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user._id}
            className="rounded-xl border border-dark-4 bg-dark-2 p-6"
          >
            <div className="flex items-start justify-between">
              <Link 
                href={`/profile/${user.id}`}
                className="flex flex-1 items-start gap-4"
              >
                <Image
                  src={user.image}
                  alt={user.name}
                  className="size-12 rounded-full object-cover"
                />
                
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-body-semibold text-light-1">
                      {user.name}
                    </h3>
                    {user.verified && (
                      <div className="bg-blue-500 flex size-5 items-center justify-center rounded-full">
                        <span className="text-xs text-white">✓</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="mb-2 text-small-regular text-gray-1">
                    @{user.username}
                  </p>
                  
                  {user.bio && (
                    <p className="mb-3 line-clamp-2 text-small-regular text-light-2">
                      {user.bio}
                    </p>
                  )}
                  
                  {user.mutualFollows && user.mutualFollows > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {/* Placeholder mutual follow avatars */}
                        {[...Array(Math.min(3, user.mutualFollows))].map((_, i) => (
                          <div
                            key={i}
                            className="size-5 rounded-full border border-dark-2 bg-dark-3"
                          />
                        ))}
                      </div>
                      <span className="text-tiny-medium text-gray-1">
                        Followed by {user.mutualFollows} people you follow
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              
              <button
                onClick={() => handleFollow(user.id)}
                disabled={isLoading(user.id)}
                className={`min-w-[80px] rounded-full px-4 py-2 text-small-semibold transition-colors ${
                  isFollowing(user.id)
                    ? 'bg-dark-3 text-light-1 hover:bg-red-500 hover:text-white'
                    : 'bg-light-1 text-dark-1 hover:bg-light-2'
                } ${isLoading(user.id) ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {isLoading(user.id) ? (
                  <div className="mx-auto size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                ) : isFollowing(user.id) ? (
                  'Following'
                ) : (
                  'Follow'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="mb-2 text-heading4-medium text-light-1">
            No suggestions available
          </h3>
          <p className="text-body-regular text-gray-1">
            Follow more people to get better recommendations!
          </p>
        </div>
      )}
    </div>
  );
}

export default SuggestedUsers;