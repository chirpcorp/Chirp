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
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 border-b border-dark-4 pb-4">
        <h1 className="head-text text-left">Explore</h1>
        <p className="text-body-regular mt-2 text-gray-1">
          Discover trending topics, interesting people, and popular content
        </p>
        
        {/* Enhanced Search Bar */}
        <div className="my-4">
          <EnhancedSearchbar placeholder="Search people, hashtags, or topics..." />
        </div>
        
        {/* Platform stats */}
        <div className="mt-4 flex gap-6 text-small-medium text-gray-1">
          <span>{platformMetrics.dailyActiveUsers.toLocaleString()} active users today</span>
          <span>{platformMetrics.dailyPosts.toLocaleString()} posts today</span>
          <span>{platformMetrics.totalUsers.toLocaleString()} total users</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="mb-8 flex gap-6 border-b border-dark-4">
        <a
          href="/explore?tab=trending"
          className={`px-1 pb-3 text-body-medium transition-colors ${ 
            activeTab === "trending" 
              ? "border-b-2 border-primary-500 text-light-1" 
              : "text-gray-1 hover:text-light-1"
          }`}
        >
          Trending
        </a>
        <a
          href="/explore?tab=people"
          className={`px-1 pb-3 text-body-medium transition-colors ${
            activeTab === "people"
              ? "border-b-2 border-primary-500 text-light-1"
              : "text-gray-1 hover:text-light-1"
          }`}
        >
          People
        </a>
        <a
          href="/explore?tab=popular"
          className={`px-1 pb-3 text-body-medium transition-colors ${
            activeTab === "popular"
              ? "border-b-2 border-primary-500 text-light-1"
              : "text-gray-1 hover:text-light-1"
          }`}
        >
          Popular
        </a>
        <a
          href="/explore?tab=live"
          className={`px-1 pb-3 text-body-medium transition-colors ${
            activeTab === "live"
              ? "border-b-2 border-primary-500 text-light-1"
              : "text-gray-1 hover:text-light-1"
          }`}
        >
          Live
        </a>
      </div>

      {/* Content based on active tab */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
            <div className="py-12 text-center">
              <h2 className="mb-4 text-heading3-bold text-light-1">
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