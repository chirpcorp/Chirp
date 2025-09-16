"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import MetricsCard from "@/components/analytics/MetricsCard";
import EngagementChart from "@/components/analytics/EngagementChart";
import ImageCropper from "@/components/shared/ImageCropper";

// Import components directly with fallbacks

function SafePrivacySettings({ userInfo }: { userInfo: any }) {
  try {
    const PrivacySettings = require("@/components/settings/PrivacySettings").default;
    return <PrivacySettings userInfo={userInfo} />;
  } catch (error) {
    return (
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-heading4-medium text-light-1">Privacy Settings</h3>
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
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-heading4-medium text-light-1">Notification Settings</h3>
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  // Null safety checks
  if (!userInfo || !userMetrics30Days || !userMetrics7Days || !platformMetrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
          <p className="text-gray-1">Loading settings...</p>
        </div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setTempImage(imageDataUrl);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    // In a real implementation, you would upload the cropped image here
    // For now, we'll just close the cropper and refresh the page to show the change
    setShowCropper(false);
    setTempImage(null);
    
    // Refresh the page to show the new image
    router.refresh();
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImage(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-8 overflow-hidden p-4 md:p-8">
            {/* Profile Overview */}
            <div className="rounded-2xl border border-dark-4 bg-gradient-to-br from-dark-2 to-dark-3 p-8">
              <h3 className="mb-6 flex items-center gap-3 text-heading3-bold text-light-1">
                <div className="rounded-lg bg-primary-500/20 p-2">
                  <Image src="/assets/profile.svg" alt="Profile" width={24} height={24} className="brightness-125" />
                </div>
                Account Information
              </h3>
              
              <div className="flex flex-col gap-8 md:flex-row">
                {/* Profile Image Section */}
                <div className="flex flex-shrink-0 flex-col items-center">
                  <div className="group relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 opacity-75 transition-opacity group-hover:opacity-100" />
                    <Image
                      src={userInfo.image || '/assets/profile.svg'}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="relative rounded-full border-4 border-dark-1 object-cover"
                    />
                  </div>
                  <label className="hover:bg-primary-600 text-sm mt-4 cursor-pointer whitespace-nowrap rounded-lg bg-primary-500 px-4 py-2 font-medium text-white transition-colors">
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>

                {/* Profile Details */}
                <div className="min-w-0 flex-1 space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="min-w-0 space-y-2">
                      <label className="text-small-semibold uppercase tracking-wide text-gray-1">Display Name</label>
                      <div className="rounded-xl border border-dark-3 bg-dark-4 p-4">
                        <p className="truncate text-body-semibold text-light-1">{userInfo.name || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <label className="text-small-semibold uppercase tracking-wide text-gray-1">Username</label>
                      <div className="rounded-xl border border-dark-3 bg-dark-4 p-4">
                        <p className="truncate text-body-medium text-light-1">@{userInfo.username || 'unknown'}</p>
                      </div>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <label className="text-small-semibold uppercase tracking-wide text-gray-1">Email</label>
                      <div className="rounded-xl border border-dark-3 bg-dark-4 p-4">
                        <p className="truncate text-body-medium text-light-1">{userInfo.email || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <label className="text-small-semibold uppercase tracking-wide text-gray-1">Location</label>
                      <div className="rounded-xl border border-dark-3 bg-dark-4 p-4">
                        <p className="truncate text-body-medium text-light-1">{userInfo.location || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bio Section */}
                  <div className="min-w-0 space-y-2">
                    <label className="text-small-semibold uppercase tracking-wide text-gray-1">Bio</label>
                    <div className="rounded-xl border border-dark-3 bg-dark-4 p-4">
                      <p className="break-words text-body-medium text-light-1">{userInfo.bio || "No bio provided"}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4 pt-4">
                    <button 
                      onClick={() => router.push('/profile/edit')}
                      className="hover:from-primary-600 hover:to-secondary-600 min-w-[120px] flex-1 transform rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-3 font-semibold text-white transition-all hover:scale-105"
                    >
                      Edit Profile
                    </button>
                    <button className="min-w-[120px] flex-1 rounded-xl border border-dark-3 bg-dark-4 px-4 py-3 font-medium text-light-1 transition-colors hover:bg-dark-3">
                      View Public Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-dark-4 bg-dark-2 p-6 text-center">
                <div className="mb-2 text-heading2-bold text-primary-500">{userMetrics30Days?.totalPosts || 0}</div>
                <div className="text-small-semibold uppercase tracking-wide text-gray-1">Total Chirps</div>
              </div>
              <div className="rounded-2xl border border-dark-4 bg-dark-2 p-6 text-center">
                <div className="mb-2 text-heading2-bold text-secondary-500">{userMetrics30Days?.totalLikes || 0}</div>
                <div className="text-small-semibold uppercase tracking-wide text-gray-1">Total Likes</div>
              </div>
              <div className="rounded-2xl border border-dark-4 bg-dark-2 p-6 text-center">
                <div className="mb-2 text-heading2-bold text-blue">{userMetrics30Days?.followersGrowth || 0}</div>
                <div className="text-small-semibold uppercase tracking-wide text-gray-1">Followers</div>
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main chart area */}
              <div className="lg:col-span-2">
                <EngagementChart userId={userInfo.id || ''} />
              </div>
              
              {/* Side metrics */}
              <div className="space-y-6">
                {/* Top performing content */}
                <div className="rounded-xl bg-dark-2 p-6">
                  <h3 className="mb-4 text-heading4-medium text-light-1">
                    Top Content
                  </h3>
                  <div className="space-y-3">
                    <div className="text-small-regular text-gray-1">
                      No top content data available yet. Start posting to see analytics!
                    </div>
                  </div>
                </div>

                {/* Platform comparison */}
                <div className="rounded-xl bg-dark-2 p-6">
                  <h3 className="mb-4 text-heading4-medium text-light-1">
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
    <div className="w-full overflow-x-hidden">
      {/* Mobile Navigation - Horizontal scrolling tabs */}
      <div className="mb-6 lg:hidden">
        <div className="rounded-xl bg-dark-2 p-2">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-3 font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "scale-105 transform bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg"
                    : "hover:scale-102 text-gray-1 hover:bg-dark-3 hover:text-light-1"
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
      <div className="flex gap-8 overflow-x-hidden">
        {/* Desktop Navigation */}
        <div className="hidden w-72 flex-shrink-0 lg:block">
          <div className="rounded-2xl border border-dark-4 bg-dark-2 p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="mb-2 text-heading4-medium text-light-1">Settings</h2>
              <p className="text-small-regular text-gray-1">Manage your preferences</p>
            </div>
            <nav className="space-y-3">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative w-full overflow-hidden rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? "scale-102 transform bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg"
                      : "text-gray-1 hover:scale-105 hover:bg-dark-3 hover:text-light-1"
                  }`}
                >
                  <div className="relative z-10 flex items-center gap-4 px-5 py-4">
                    <div className={`rounded-lg p-2 transition-colors ${
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
                    <div className="min-w-0 text-left">
                      <span className="block truncate text-body-medium font-semibold">{tab.label}</span>
                      <span className="truncate text-xs opacity-70">
                        {tab.id === 'general' && 'Account info'}
                        {tab.id === 'privacy' && 'Security settings'}
                        {tab.id === 'notifications' && 'Alerts & sounds'}
                        {tab.id === 'analytics' && 'Insights & data'}
                      </span>
                    </div>
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-primary-500/10 to-secondary-500/10" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="min-w-0 flex-1">
          <div className="overflow-x-hidden rounded-2xl bg-dark-1">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && tempImage && (
        <ImageCropper
          src={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}