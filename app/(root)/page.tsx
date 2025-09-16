import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import TrendingSidebar from "@/components/shared/TrendingSidebar";
import InfiniteFeed from "@/components/feed/InfiniteFeed";
import { getSmartFeed } from "@/lib/algorithms/postRanking";

import { fetchUser } from "@/lib/actions/user.actions";

// Simplified Post type based on what InfiniteFeed expects
interface Post {
  _id: string;
  id: string;
  content: string;
  text: string;
  parentId: string | null;
  author: {
    _id: string;
    id: string;
    name: string;
    image: string;
    verified: boolean;
  } | null;
  community: {
    _id: string;
    id: string;
    name: string;
    image: string;
  } | null;
  createdAt: string;
  hashtags: string[];
  mentions: { userId: string; username: string }[];
  communityTags: { communityId: string; communityUsername: string }[];
  likes: string[];
  shares: string[];
  attachments: {
    type: string;
    url: string;
    filename?: string;
    size?: number;
    duration?: number;
    dimensions?: { width: number; height: number };
    thumbnail?: string;
    metadata?: any;
  }[];
  isLikedByCurrentUser: boolean;
  comments: {
    _id: string;
    author: {
      _id: string;
      id: string;
      name: string;
      image: string;
    };
  }[];
}

async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const user = await currentUser();
  if (!user) return null;

  let userInfo = null;
  let dbConnectionFailed = false;
  
  try {
    userInfo = await fetchUser(user.id);
  } catch (error) {
    console.error("Error fetching user in home page:", error);
    // Check if it's a database connection error
    if (error instanceof Error && (error.message.includes("MongoDB") || error.message.includes("buffering timed out"))) {
      dbConnectionFailed = true;
    }
  }
  
  // Only redirect to onboarding if we successfully fetched user info and they're not onboarded
  // If database connection failed, we should allow them to continue to the home page
  if (!userInfo?.onboarded && !dbConnectionFailed) redirect("/onboarding");

  // Get smart personalized feed using advanced algorithms
  // If database connection failed, use an empty feed
  let initialPosts: Post[] = [];
  if (!dbConnectionFailed) {
    try {
      const posts = await getSmartFeed(
        user.id,
        20,
        0 // Start from beginning
      );
      initialPosts = posts as Post[];
    } catch (error) {
      console.error("Error fetching smart feed:", error);
      initialPosts = []; // Use empty feed if there's an error
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6">
      {/* Main Feed */}
      <div className="max-w-2xl flex-1">
        <div className="mb-6 border-b border-dark-4 pb-4">
          <h1 className='head-text text-left'>Home</h1>
          {dbConnectionFailed && (
            <div className="text-sm mb-4 rounded bg-yellow-100 p-2 text-yellow-800">
              Warning: Database connection failed. Some features may be limited.
            </div>
          )}
          <div className="mt-4 flex gap-4">
            <button className="border-b-2 border-primary-500 pb-2 font-semibold text-light-1">
              For you
            </button>
            <button className="pb-2 text-gray-1 transition-colors hover:text-light-1">
              Following
            </button>
            <button className="pb-2 text-gray-1 transition-colors hover:text-light-1">
              Trending
            </button>
          </div>
        </div>

        {initialPosts.length === 0 ? (
          <div className="py-12 text-center">
            <h2 className="mb-4 text-heading3-bold text-light-1">
              Welcome to Chirp! 👋
            </h2>
            <p className="text-body-regular mb-6 text-gray-1">
              Start following people to see their posts in your feed.
            </p>
            <a 
              href="/explore" 
              className="hover:bg-primary-600 rounded-full bg-primary-500 px-6 py-3 text-white transition-colors"
            >
              Explore Chirp
            </a>
          </div>
        ) : (
          <InfiniteFeed 
            userId={user.id} 
            initialPosts={JSON.parse(JSON.stringify(initialPosts))}
          />
        )}
      </div>

      {/* Sidebar */}
      <div className="hidden w-80 lg:block">
        <TrendingSidebar />
      </div>
    </div>
  );
}

export default Home;