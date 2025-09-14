"use client";

import Link from "next/link";
import { useState } from "react";

interface TrendingTopic {
  hashtag: string;
  postCount: number;
  userCount: number;
  engagement: number;
  trendScore: number;
}

interface Props {
  trends: TrendingTopic[];
}

export function TrendingTopics({ trends }: Props) {
  const [timeFilter, setTimeFilter] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getTrendIcon = (index: number) => {
    switch (index) {
      case 0: return "🔥";
      case 1: return "⚡";
      case 2: return "💫";
      default: return "📈";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-heading3-bold text-light-1">
          Trending Right Now
        </h2>
        
        {/* Time filter */}
        <div className="flex gap-2">
          {['1h', '6h', '24h', '7d'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period as any)}
              className={`rounded-full px-3 py-1 text-small-medium transition-colors ${
                timeFilter === period
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-3 text-gray-1 hover:bg-dark-2'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {trends.map((trend, index) => (
          <Link
            key={trend.hashtag}
            href={`/hashtag/${trend.hashtag}`}
            className="block rounded-xl border border-dark-4 bg-dark-2 p-6 transition-colors hover:bg-dark-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="text-2xl">
                  {getTrendIcon(index)}
                </div>
                
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-small-medium text-gray-1">
                      #{index + 1} Trending
                    </span>
                    {index < 3 && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-tiny-medium text-white">
                        HOT
                      </span>
                    )}
                  </div>
                  
                  <h3 className="mb-2 text-heading4-medium text-light-1">
                    #{trend.hashtag}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-small-regular text-gray-1">
                    <span>{formatCount(trend.postCount)} posts</span>
                    <span>•</span>
                    <span>{formatCount(trend.userCount)} people talking</span>
                    <span>•</span>
                    <span>{formatCount(trend.engagement)} interactions</span>
                  </div>
                </div>
              </div>
              
              {/* Trend indicator */}
              <div className="flex flex-col items-end">
                <div className="mb-2 flex items-center gap-1">
                  <div className="size-2 animate-pulse rounded-full bg-green-500"></div>
                  <span className="text-tiny-medium text-green-500">Live</span>
                </div>
                
                {/* Mini chart placeholder */}
                <div className="h-6 w-12 rounded bg-gradient-to-r from-primary-500 to-green-500 opacity-60"></div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {trends.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="mb-2 text-heading4-medium text-light-1">
            No trends yet
          </h3>
          <p className="text-body-regular text-gray-1">
            Be the first to start a trending topic!
          </p>
        </div>
      )}
    </div>
  );
}

export default TrendingTopics;