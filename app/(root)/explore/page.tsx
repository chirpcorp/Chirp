import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTrendingTopics, getSuggestedUsers } from "@/lib/algorithms/recommendation";
import { getPlatformMetrics } from "@/lib/algorithms/analytics";

import { fetchUser } from "@/lib/actions/user.actions";
import TrendingTopics from "@/components/explore/TrendingTopics";
import SuggestedUsers from "@/components/explore/SuggestedUsers";
import PopularChirps from "@/components/explore/PopularChirps";
import EnhancedSearchbar from "@/components/explore/EnhancedSearchbar";

async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  // Get trending data
  const [trendingTopics, suggestedUsers, platformMetrics] = await Promise.all([
    getTrendingTopics(24),
    getSuggestedUsers(user.id, 20),
    getPlatformMetrics(),
  ]);

  const activeTab = resolvedSearchParams.tab || "trending";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-dark-4 pb-4 mb-6">
        <h1 className="head-text text-left">Explore</h1>
        <p className="text-body-regular text-gray-1 mt-2">
          Discover trending topics, interesting people, and popular content
        </p>
        
        {/* Enhanced Search Bar */}
        <div className="mt-4 mb-4">
          <EnhancedSearchbar placeholder="Search people, hashtags, or topics..." />
        </div>
        
        {/* Platform stats */}
        <div className="flex gap-6 mt-4 text-small-medium text-gray-1">
          <span>{platformMetrics.dailyActiveUsers.toLocaleString()} active users today</span>
          <span>{platformMetrics.dailyPosts.toLocaleString()} posts today</span>
          <span>{platformMetrics.totalUsers.toLocaleString()} total users</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-6 mb-8 border-b border-dark-4">
        <a
          href="/explore?tab=trending"
          className={`pb-3 px-1 text-body-medium transition-colors ${ 
            activeTab === "trending" 
              ? "text-light-1 border-b-2 border-primary-500" 
              : "text-gray-1 hover:text-light-1"
          }`}
        >
          Trending
        </a>
        <a
          href="/explore?tab=people"
          className={`pb-3 px-1 text-body-medium transition-colors ${
            activeTab === "people"
              ? "text-light-1 border-b-2 border-primary-500"
              : "text-gray-1 hover:text-light-1"
          }`}
        >
          People
        </a>
        <a
          href="/explore?tab=popular"
          className={`pb-3 px-1 text-body-medium transition-colors ${
            activeTab === "popular"
              ? "text-light-1 border-b-2 border-primary-500"
              : "text-gray-1 hover:text-light-1"
          }`}
        >
          Popular
        </a>
        <a
          href="/explore?tab=live"
          className={`pb-3 px-1 text-body-medium transition-colors ${
            activeTab === "live"
              ? "text-light-1 border-b-2 border-primary-500"
              : "text-gray-1 hover:text-light-1"
          }`}
        >
          Live
        </a>
      </div>

      {/* Content based on active tab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === "trending" && (
          <>
            <div className="lg:col-span-2">
              <TrendingTopics trends={trendingTopics} />
            </div>
            <div>
              <SuggestedUsers users={suggestedUsers.slice(0, 5)} />
            </div>
          </>
        )}

        {activeTab === "people" && (
          <div className="lg:col-span-3">
            <SuggestedUsers users={suggestedUsers} />
          </div>
        )}

        {activeTab === "popular" && (
          <div className="lg:col-span-3">
            <PopularChirps />
          </div>
        )}

        {activeTab === "live" && (
          <div className="lg:col-span-3">
            <div className="text-center py-12">
              <h2 className="text-heading3-bold text-light-1 mb-4">
                Live Events Coming Soon! 🚀
              </h2>
              <p className="text-body-regular text-gray-1">
                Real-time events and live audio spaces will be available soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExplorePage;