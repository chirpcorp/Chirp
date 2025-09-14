"use client";

import { useState, useEffect } from "react";
import ChirpCard from "@/components/cards/ChirpCard";
import { getPopularPosts } from "@/lib/algorithms/recommendation";

export function PopularChirps() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d'>('24h');

  useEffect(() => {
    loadPopularPosts();
  }, [timeFilter]);

  const loadPopularPosts = async () => {
    setLoading(true);
    try {
      // Load popular posts using the new function
      const popularPosts = await getPopularPosts(timeFilter);
      setPosts(popularPosts);
      setLoading(false);
    } catch (error) {
      console.error("Error loading popular posts:", error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-heading3-bold text-light-1">
          Popular Posts
        </h2>
        
        {/* Time filter */}
        <div className="flex gap-2">
          {[
            { value: '1h', label: 'Last hour' },
            { value: '24h', label: 'Today' },
            { value: '7d', label: 'This week' }
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setTimeFilter(period.value as any)}
              className={`px-3 py-1 rounded-full text-small-medium transition-colors ${
                timeFilter === period.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-3 text-gray-1 hover:bg-dark-2'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-dark-2 p-6 rounded-xl animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-dark-3 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-dark-3 rounded w-1/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-dark-3 rounded w-full"></div>
                    <div className="h-4 bg-dark-3 rounded w-3/4"></div>
                  </div>
                  <div className="flex gap-6">
                    <div className="h-6 w-6 bg-dark-3 rounded"></div>
                    <div className="h-6 w-6 bg-dark-3 rounded"></div>
                    <div className="h-6 w-6 bg-dark-3 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post: any, index) => (
            <div key={post._id} className="relative">
              {/* Popular indicator */}
              <div className="absolute -left-4 top-4 z-10">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-tiny-medium">
                  #{index + 1} Popular
                </div>
              </div>
              
              <ChirpCard
                {...post}
                currentUserId="user-id" // You'd get this from context
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔥</div>
          <h3 className="text-heading4-medium text-light-1 mb-2">
            No popular posts yet
          </h3>
          <p className="text-body-regular text-gray-1">
            Start engaging with posts to see what's trending!
          </p>
        </div>
      )}
    </div>
  );
}

export default PopularChirps;