import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";
import { getUserMetrics, getPlatformMetrics } from "@/lib/algorithms/analytics";
import SettingsLayout from "@/components/settings/SettingsLayout";

async function SettingsPage() {
  const user = await currentUser();
  if (!user) return null;

  try {
    const userInfo = await fetchUser(user.id);
    if (!userInfo?.onboarded) redirect("/onboarding");

    // Get user metrics for analytics tab
    const [userMetrics30Days, userMetrics7Days, platformMetrics] = await Promise.all([
      getUserMetrics(user.id, 30),
      getUserMetrics(user.id, 7),
      getPlatformMetrics(),
    ]);

    // Ensure joinedDate is always a string
    let joinedDateStr = '';
    if (userInfo.joinedDate) {
      if (typeof userInfo.joinedDate === 'string') {
        joinedDateStr = userInfo.joinedDate;
      } else if (userInfo.joinedDate.toISOString) {
        joinedDateStr = userInfo.joinedDate.toISOString();
      } else {
        joinedDateStr = new Date(userInfo.joinedDate).toISOString();
      }
    } else {
      joinedDateStr = new Date().toISOString();
    }

    return (
      <div className="w-full space-y-8 overflow-hidden">
        <div className="border-b border-dark-4 pb-6">
          <h1 className="head-text text-left">Settings</h1>
          <p className="text-body-regular mt-2 text-gray-1">
            Manage your account preferences and privacy settings
          </p>
        </div>

        <SettingsLayout
          userInfo={{
            _id: userInfo._id?.toString() || '',
            id: userInfo.id,
            name: userInfo.name || '',
            username: userInfo.username || '',
            email: userInfo.email || '',
            image: userInfo.image || '',
            bio: userInfo.bio || '',
            location: userInfo.location || '',
            website: userInfo.website || '',
            isPrivate: userInfo.isPrivate || false,
            joinedDate: joinedDateStr,
          }}
          userMetrics30Days={{
            totalPosts: userMetrics30Days.totalPosts || 0,
            totalLikes: userMetrics30Days.totalLikes || 0,
            followersGrowth: userMetrics30Days.followersGrowth || 0,
            engagementScore: userMetrics30Days.engagementScore || 0,
          }}
          userMetrics7Days={{
            totalPosts: userMetrics7Days.totalPosts || 0,
            totalLikes: userMetrics7Days.totalLikes || 0,
            followersGrowth: userMetrics7Days.followersGrowth || 0,
            engagementScore: userMetrics7Days.engagementScore || 0,
          }}
          platformMetrics={{
            dailyActiveUsers: platformMetrics.dailyActiveUsers || 0,
            dailyPosts: platformMetrics.dailyPosts || 0,
            totalUsers: platformMetrics.totalUsers || 0,
          }}
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching user settings data:", error);
    redirect("/onboarding");
  }
}

export default SettingsPage;