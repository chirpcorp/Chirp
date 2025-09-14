"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTrendingTopics, getSuggestedUsers } from "@/lib/algorithms/recommendation";
import { getPlatformMetrics } from "@/lib/algorithms/analytics";

interface TrendingTopic {
  hashtag: string;
  postCount: number;
  userCount: number;
  engagement: number;
  trendScore: number;
}

interface PlatformMetrics {
  totalUsers: number;
  totalChirps: number;
  totalCommunities: number;
  dailyActiveUsers: number;
  dailyPosts: number;
  weeklyActiveUsers: number;
  weeklyPosts: number;
  generatedAt: string;
}

function TrendingSidebar() {
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      const [trendingTopics, metrics] = await Promise.all([
        getTrendingTopics(24),
        getPlatformMetrics()
      ]);
      
      setTrends(trendingTopics);
      setPlatformMetrics(metrics);
      // Note: getSuggestedUsers needs currentUserId, commenting out for now
      // const suggestedUsers = await getSuggestedUsers(currentUserId, 5);
      // setSuggestions(suggestedUsers);
    } catch (error) {
      console.error("Error loading trends:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className="sticky top-4 space-y-4">
        <div className="bg-dark-2 rounded-xl p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-dark-3 rounded w-3/4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-dark-3 rounded w-1/2"></div>
                <div className="h-3 bg-dark-3 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-4 space-y-4">
      {/* Trending Topics */}
      <div className="bg-dark-2 rounded-xl p-4">
        <h2 className="text-heading4-medium text-light-1 mb-4">
          What's happening
        </h2>
        
        <div className="space-y-3">
          {trends.slice(0, 5).map((trend, index) => (
            <Link
              key={trend.hashtag}
              href={`/hashtag/${trend.hashtag}`}
              className="block hover:bg-dark-3 rounded-lg p-2 -m-2 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-small-medium text-gray-1">
                    {index + 1} · Trending
                  </p>
                  <p className="text-body-semibold text-light-1">
                    #{trend.hashtag}
                  </p>
                  <p className="text-small-regular text-gray-1">
                    {formatCount(trend.postCount)} posts
                  </p>
                </div>
                
              </div>
            </Link>
          ))}
          
          <Link
            href="/explore/"
            className="text-primary-500 text-small-medium hover:underline"
          >
            Show more
          </Link>
        </div>
      </div>

      {/* Who to follow */}
      {suggestions.length > 0 && (
        <div className="bg-dark-2 rounded-xl p-4">
          <h2 className="text-heading4-medium text-light-1 mb-4">
            Who to follow
          </h2>
          
          <div className="space-y-3">
            {suggestions.map((user) => (
              <div key={user._id} className="flex items-center justify-between">
                <Link 
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-body-semibold text-light-1 truncate">
                        {user.name}
                      </p>
                      {user.verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <p className="text-small-regular text-gray-1 truncate">
                      @{user.username}
                    </p>
                    {user.mutualFollows > 0 && (
                      <p className="text-tiny-medium text-gray-1">
                        {user.mutualFollows} mutual follows
                      </p>
                    )}
                  </div>
                </Link>
                
                <button className="bg-light-1 text-dark-1 px-4 py-1.5 rounded-full text-small-semibold hover:bg-light-2 transition-colors">
                  Follow
                </button>
              </div>
            ))}
            
            <Link
              href="/explore/people"
              className="text-primary-500 text-small-medium hover:underline"
            >
              Show more
            </Link>
          </div>
        </div>
      )}

      {/* Platform stats */}
      <div className="bg-dark-2 rounded-xl p-4">
        <h2 className="text-heading4-medium text-light-1 mb-4">
          Platform Activity
        </h2>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-body-regular text-gray-1">Active users</span>
            <span className="text-body-semibold text-light-1">
              {platformMetrics ? formatCount(platformMetrics.dailyActiveUsers) : "---"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-body-regular text-gray-1">Posts today</span>
            <span className="text-body-semibold text-light-1">
              {platformMetrics ? formatCount(platformMetrics.dailyPosts) : "---"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-body-regular text-gray-1">Communities</span>
            <span className="text-body-semibold text-light-1">
              {platformMetrics ? formatCount(platformMetrics.totalCommunities) : "---"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-dark-2 rounded-xl p-4">
        <div className="flex flex-wrap gap-2 text-tiny-medium text-gray-1">
          <Link href="#/terms" className="hover:underline">Terms of Service</Link>
          <Link href="#/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="#/cookie" className="hover:underline">Cookie Policy</Link>
          <Link href="#/accessibility" className="hover:underline">Accessibility</Link>
          <Link href="#/ads" className="hover:underline">Ads info</Link>
        </div>
        <p className="text-tiny-medium text-gray-1 mt-2">
          © 2025 Chirp Corp.
        </p>
      </div>
    </div>
  );
}

export default TrendingSidebar;
