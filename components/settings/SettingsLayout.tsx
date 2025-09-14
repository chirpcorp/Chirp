"use client";

import { useState, Suspense } from "react";
import Image from "next/image";

import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import MetricsCard from "@/components/analytics/MetricsCard";
import EngagementChart from "@/components/analytics/EngagementChart";

// Import components directly with fallbacks

function SafePrivacySettings({ userInfo }: { userInfo: any }) {
  try {
    const PrivacySettings = require("@/components/settings/PrivacySettings").default;
    return <PrivacySettings userInfo={userInfo} />;
  } catch (error) {
    return (
      <div className="bg-dark-2 rounded-xl p-6">
        <h3 className="text-heading4-medium text-light-1 mb-4">Privacy Settings</h3>
        <p className="text-gray-1">Privacy settings are temporarily unavailable.</p>
      </div>
    );
  }
}

function SafeNotificationSettings() {
  try {
    const NotificationSettings = require("@/components/settings/NotificationSettings").default;
    return <NotificationSettings />;
  } catch (error) {
    return (
      <div className="bg-dark-2 rounded-xl p-6">
        <h3 className="text-heading4-medium text-light-1 mb-4">Notification Settings</h3>
        <p className="text-gray-1">Notification settings are temporarily unavailable.</p>
      </div>
    );
  }
}

interface UserInfo {
  _id: string;
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  bio: string;
  location: string;
  website: string;
  isPrivate: boolean;
  joinedDate: string;
}

interface UserMetrics {
  totalPosts: number;
  totalLikes: number;
  followersGrowth: number;
  engagementScore: number;
}

interface PlatformMetrics {
  dailyActiveUsers: number;
  dailyPosts: number;
  totalUsers: number;
}

interface Props {
  userInfo: UserInfo;
  userMetrics30Days: UserMetrics;
  userMetrics7Days: UserMetrics;
  platformMetrics: PlatformMetrics;
}

const settingsTabs = [
  { id: "general", label: "General", icon: "/assets/settings.svg" },
  { id: "privacy", label: "Privacy", icon: "/assets/profile.svg" },
  { id: "notifications", label: "Notifications", icon: "/assets/heart.svg" },
  { id: "analytics", label: "Analytics", icon: "/assets/analytics.svg" },
];

export default function SettingsLayout({ 
  userInfo, 
  userMetrics30Days, 
  userMetrics7Days, 
  platformMetrics 
}: Props) {
  const [activeTab, setActiveTab] = useState("general");

  // Null safety checks
  if (!userInfo || !userMetrics30Days || !userMetrics7Days || !platformMetrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-1">Loading settings...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="p-8 space-y-8">
            {/* Profile Overview */}
            <div className="bg-gradient-to-br from-dark-2 to-dark-3 rounded-2xl p-8 border border-dark-4">
              <h3 className="text-heading3-bold text-light-1 mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary-500/20 rounded-lg">
                  <Image src="/assets/profile.svg" alt="Profile" width={24} height={24} className="brightness-125" />
                </div>
                Account Information
              </h3>
              
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Image Section */}
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full opacity-75 group-hover:opacity-100 transition-opacity" />
                    <Image
                      src={userInfo.image || '/assets/profile.svg'}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="relative rounded-full object-cover border-4 border-dark-1"
                    />
                  </div>
                  <button className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Change Photo
                  </button>
                </div>

                {/* Profile Details */}
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-small-semibold text-gray-1 uppercase tracking-wide">Display Name</label>
                      <div className="bg-dark-4 rounded-xl p-4 border border-dark-3">
                        <p className="text-body-semibold text-light-1">{userInfo.name || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-small-semibold text-gray-1 uppercase tracking-wide">Username</label>
                      <div className="bg-dark-4 rounded-xl p-4 border border-dark-3">
                        <p className="text-body-medium text-light-1">@{userInfo.username || 'unknown'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-small-semibold text-gray-1 uppercase tracking-wide">Email</label>
                      <div className="bg-dark-4 rounded-xl p-4 border border-dark-3">
                        <p className="text-body-medium text-light-1">{userInfo.email || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-small-semibold text-gray-1 uppercase tracking-wide">Location</label>
                      <div className="bg-dark-4 rounded-xl p-4 border border-dark-3">
                        <p className="text-body-medium text-light-1">{userInfo.location || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bio Section */}
                  <div className="space-y-2">
                    <label className="text-small-semibold text-gray-1 uppercase tracking-wide">Bio</label>
                    <div className="bg-dark-4 rounded-xl p-4 border border-dark-3">
                      <p className="text-body-medium text-light-1">{userInfo.bio || "No bio provided"}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl py-3 font-semibold transition-all transform hover:scale-105">
                      Edit Profile
                    </button>
                    <button className="px-6 bg-dark-4 hover:bg-dark-3 text-light-1 rounded-xl py-3 font-medium transition-colors border border-dark-3">
                      View Public Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-dark-2 rounded-2xl p-6 border border-dark-4 text-center">
                <div className="text-heading2-bold text-primary-500 mb-2">{userMetrics30Days?.totalPosts || 0}</div>
                <div className="text-small-semibold text-gray-1 uppercase tracking-wide">Total Chirps</div>
              </div>
              <div className="bg-dark-2 rounded-2xl p-6 border border-dark-4 text-center">
                <div className="text-heading2-bold text-secondary-500 mb-2">{userMetrics30Days?.totalLikes || 0}</div>
                <div className="text-small-semibold text-gray-1 uppercase tracking-wide">Total Likes</div>
              </div>
              <div className="bg-dark-2 rounded-2xl p-6 border border-dark-4 text-center">
                <div className="text-heading2-bold text-blue mb-2">{userMetrics30Days?.followersGrowth || 0}</div>
                <div className="text-small-semibold text-gray-1 uppercase tracking-wide">Followers</div>
              </div>
            </div>
          </div>
        );

      case "privacy":
        return <SafePrivacySettings userInfo={userInfo} />;

      case "notifications":
        return <SafeNotificationSettings />;

      case "analytics":
        return (
          <div className="space-y-8">
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
                <EngagementChart userId={userInfo.id || ''} />
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

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Mobile Navigation - Horizontal scrolling tabs */}
      <div className="lg:hidden mb-6">
        <div className="bg-dark-2 rounded-xl p-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg transform scale-105"
                    : "text-gray-1 hover:bg-dark-3 hover:text-light-1 hover:scale-102"
                }`}
              >
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={18}
                  height={18}
                  className={`object-contain ${
                    activeTab === tab.id ? "brightness-0 invert" : ""
                  }`}
                />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex gap-8">
        {/* Desktop Navigation */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-dark-2 rounded-2xl p-6 shadow-xl border border-dark-4">
            <div className="mb-6">
              <h2 className="text-heading4-medium text-light-1 mb-2">Settings</h2>
              <p className="text-small-regular text-gray-1">Manage your preferences</p>
            </div>
            <nav className="space-y-3">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg transform scale-102"
                      : "text-gray-1 hover:bg-dark-3 hover:text-light-1 hover:scale-105"
                  }`}
                >
                  <div className="flex items-center gap-4 px-5 py-4 relative z-10">
                    <div className={`p-2 rounded-lg transition-colors ${
                      activeTab === tab.id 
                        ? "bg-white/20" 
                        : "bg-dark-4 group-hover:bg-dark-1"
                    }`}>
                      <Image
                        src={tab.icon}
                        alt={tab.label}
                        width={20}
                        height={20}
                        className={`object-contain transition-all ${
                          activeTab === tab.id ? "brightness-0 invert" : "group-hover:brightness-125"
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <span className="text-body-medium font-semibold block">{tab.label}</span>
                      <span className="text-xs opacity-70">
                        {tab.id === 'general' && 'Account info'}
                        {tab.id === 'privacy' && 'Security settings'}
                        {tab.id === 'notifications' && 'Alerts & sounds'}
                        {tab.id === 'analytics' && 'Insights & data'}
                      </span>
                    </div>
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 animate-pulse" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-dark-1 rounded-2xl overflow-hidden">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}