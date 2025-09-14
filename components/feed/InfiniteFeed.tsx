"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import ChirpCard from "@/components/cards/ChirpCard";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { getSmartFeed } from "@/lib/algorithms/postRanking";

interface Props {
  userId: string;
  initialPosts?: any[];
}

export function InfiniteFeed({ userId, initialPosts = [] }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      // Calculate skip based on current posts length to avoid duplicates
      const skip = posts.length;
      const newPosts = await getSmartFeed(
        userId, 
        20,
        skip // Pass skip parameter for proper pagination
      );
      
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        // Filter out any duplicates by ID
        const existingIds = new Set(posts.map(p => p._id));
        const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post._id));
        
        if (uniqueNewPosts.length === 0) {
          setHasMore(false);
        } else {
          setPosts(prev => [...prev, ...uniqueNewPosts]);
          setPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMorePosts();
    }
  }, [inView, hasMore, loading]);

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <ChirpCard
          key={`${post._id}-${index}`}
          id={post._id}
          currentUserId={userId}
          parentId={post.parentId}
          content={post.content || post.text}
          author={post.author}
          community={post.community}
          createdAt={post.createdAt}
          comments={post.comments || post.children || []}
          hashtags={post.hashtags || []}
          mentions={post.mentions || []}
          communityTags={post.communityTags || []}
          likes={post.likes || []}
          shares={post.shares || []}
          attachments={post.attachments || []}
          isLikedByCurrentUser={post.isLikedByCurrentUser || false}
        />
      ))}
      
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}
      
      {hasMore && (
        <div ref={ref} className="h-10 flex items-center justify-center">
          {loading && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          )}
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-1">You're all caught up! 🎉</p>
          <p className="text-gray-1 text-sm mt-2">
            Check back later for more updates
          </p>
        </div>
      )}
    </div>
  );
}

export default InfiniteFeed;