"use client";

import Link from "next/link";
import { useState } from "react";

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
          className="text-primary-500 text-small-medium hover:underline"
        >
          See all
        </Link>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-dark-2 rounded-xl p-6 border border-dark-4"
          >
            <div className="flex items-start justify-between">
              <Link 
                href={`/profile/${user.id}`}
                className="flex items-start gap-4 flex-1"
              >
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-body-semibold text-light-1">
                      {user.name}
                    </h3>
                    {user.verified && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-small-regular text-gray-1 mb-2">
                    @{user.username}
                  </p>
                  
                  {user.bio && (
                    <p className="text-small-regular text-light-2 mb-3 line-clamp-2">
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
                            className="w-5 h-5 bg-dark-3 rounded-full border border-dark-2"
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
                className={`px-4 py-2 rounded-full text-small-semibold transition-colors min-w-[80px] ${
                  isFollowing(user.id)
                    ? 'bg-dark-3 text-light-1 hover:bg-red-500 hover:text-white'
                    : 'bg-light-1 text-dark-1 hover:bg-light-2'
                } ${isLoading(user.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading(user.id) ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto"></div>
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
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-heading4-medium text-light-1 mb-2">
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