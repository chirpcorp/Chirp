import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserMetrics, getPlatformMetrics } from "@/lib/algorithms/analytics";
import { fetchUser } from "@/lib/actions/user.actions";

import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import MetricsCard from "@/components/analytics/MetricsCard";
import EngagementChart from "@/components/analytics/EngagementChart";

async function AnalyticsPage() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  // Get user metrics
  const [userMetrics30Days, userMetrics7Days, platformMetrics] = await Promise.all([
    getUserMetrics(user.id, 30),
    getUserMetrics(user.id, 7),
    getPlatformMetrics(),
  ]);

  return (
    <div className="w-full space-y-8 overflow-hidden">
      {/* Header */}
      <div className="border-b border-dark-4 pb-6">
        <h1 className="head-text text-left">Analytics</h1>
        <p className="text-body-regular text-gray-1 mt-2">
          Track your performance and audience engagement
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Posts"
          value={userMetrics30Days.totalPosts}
          change={userMetrics30Days.totalPosts - userMetrics7Days.totalPosts}
          icon="📝"
        />
        <MetricsCard
          title="Total Likes"
          value={userMetrics30Days.totalLikes}
          change={userMetrics30Days.totalLikes - userMetrics7Days.totalLikes}
          icon="❤️"
        />
        <MetricsCard
          title="Followers"
          value={userMetrics30Days.followersGrowth}
          change={userMetrics30Days.followersGrowth - userMetrics7Days.followersGrowth}
          icon="👥"
        />
        <MetricsCard
          title="Engagement Rate"
          value={`${(userMetrics30Days.engagementScore * 100).toFixed(1)}%`}
          change={(userMetrics30Days.engagementScore - userMetrics7Days.engagementScore) * 100}
          icon="📊"
          isPercentage
        />
      </div>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main chart area */}
        <div className="lg:col-span-2">
          <EngagementChart userId={user.id} />
        </div>
        
        {/* Side metrics */}
        <div className="space-y-6">
          {/* Top performing content */}
          <div className="bg-dark-2 rounded-xl p-6">
            <h3 className="text-heading4-medium text-light-1 mb-4">
              Top Content
            </h3>
            <div className="space-y-3">
              <div className="text-small-regular text-gray-1">
                No top content data available yet. Start posting to see analytics!
              </div>
            </div>
          </div>

          {/* Audience insights */}
          <div className="bg-dark-2 rounded-xl p-6">
            <h3 className="text-heading4-medium text-light-1 mb-4">
              Audience Insights
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-small-medium mb-2">
                  <span className="text-gray-1">Most active time</span>
                  <span className="text-light-1">2:00 PM - 4:00 PM</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-small-medium mb-2">
                  <span className="text-gray-1">Peak day</span>
                  <span className="text-light-1">Tuesday</span>
                </div>
              </div>
            </div>
          </div>

          {/* Platform comparison */}
          <div className="bg-dark-2 rounded-xl p-6">
            <h3 className="text-heading4-medium text-light-1 mb-4">
              Platform Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-small-medium">
                <span className="text-gray-1">Active users today</span>
                <span className="text-light-1">{platformMetrics.dailyActiveUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-small-medium">
                <span className="text-gray-1">Posts today</span>
                <span className="text-light-1">{platformMetrics.dailyPosts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-small-medium">
                <span className="text-gray-1">Total users</span>
                <span className="text-light-1">{platformMetrics.totalUsers.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <AnalyticsDashboard 
        userMetrics={userMetrics30Days}
        platformMetrics={platformMetrics}
      />
    </div>
  );
}

export default AnalyticsPage;