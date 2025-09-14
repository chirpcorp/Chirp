"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTrendingTopics } from "@/lib/algorithms/recommendation";
import { getPlatformMetrics } from "@/lib/algorithms/analytics";
import Image from "next/image";

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
  const [suggestions,] = useState<any[]>([]);
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
        <div className="rounded-xl bg-dark-2 p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-3/4 rounded bg-dark-3"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-1/2 rounded bg-dark-3"></div>
                <div className="h-3 w-1/3 rounded bg-dark-3"></div>
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
      <div className="rounded-xl bg-dark-2 p-4">
        <h2 className="mb-4 text-heading4-medium text-light-1">
          What&apos;s happening
        </h2>
        
        <div className="space-y-3">
          {trends.slice(0, 5).map((trend, index) => (
            <Link
              key={trend.hashtag}
              href={`/hashtag/${trend.hashtag}`}
              className="-m-2 block rounded-lg p-2 transition-colors hover:bg-dark-3"
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
            className="text-small-medium text-primary-500 hover:underline"
          >
            Show more
          </Link>
        </div>
      </div>

      {/* Who to follow */}
      {suggestions.length > 0 && (
        <div className="rounded-xl bg-dark-2 p-4">
          <h2 className="mb-4 text-heading4-medium text-light-1">
            Who to follow
          </h2>
          
          <div className="space-y-3">
            {suggestions.map((user) => (
              <div key={user._id} className="flex items-center justify-between">
                <Link 
                  href={`/profile/${user.id}`}
                  className="flex flex-1 items-center gap-3"
                >
                  <Image
                    src={user.image}
                    alt={user.name}
                    className="size-10 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-body-semibold text-light-1">
                        {user.name}
                      </p>
                      {user.verified && (
                        <div className="bg-blue-500 flex size-4 items-center justify-center rounded-full">
                          <span className="text-xs text-white">✓</span>
                        </div>
                      )}
                    </div>
                    <p className="truncate text-small-regular text-gray-1">
                      @{user.username}
                    </p>
                    {user.mutualFollows > 0 && (
                      <p className="text-tiny-medium text-gray-1">
                        {user.mutualFollows} mutual follows
                      </p>
                    )}
                  </div>
                </Link>
                
                <button className="rounded-full bg-light-1 px-4 py-1.5 text-small-semibold text-dark-1 transition-colors hover:bg-light-2">
                  Follow
                </button>
              </div>
            ))}
            
            <Link
              href="/explore/people"
              className="text-small-medium text-primary-500 hover:underline"
            >
              Show more
            </Link>
          </div>
        </div>
      )}

      {/* Platform stats */}
      <div className="rounded-xl bg-dark-2 p-4">
        <h2 className="mb-4 text-heading4-medium text-light-1">
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
      <div className="rounded-xl bg-dark-2 p-4">
        <div className="flex flex-wrap gap-2 text-tiny-medium text-gray-1">
          <Link href="#/terms" className="hover:underline">Terms of Service</Link>
          <Link href="#/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="#/cookie" className="hover:underline">Cookie Policy</Link>
          <Link href="#/accessibility" className="hover:underline">Accessibility</Link>
          <Link href="#/ads" className="hover:underline">Ads info</Link>
        </div>
        <p className="mt-2 text-tiny-medium text-gray-1">
          © 2025 Chirp Corp.
        </p>
      </div>
    </div>
  );
}

export default TrendingSidebar;
