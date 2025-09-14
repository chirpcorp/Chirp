import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import ChirpCard from "@/components/cards/ChirpCard";
import TrendingSidebar from "@/components/shared/TrendingSidebar";
import InfiniteFeed from "@/components/feed/InfiniteFeed";
import { getSmartFeed } from "@/lib/algorithms/postRanking";

import { fetchUser } from "@/lib/actions/user.actions";

async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  // Get smart personalized feed using advanced algorithms
  const initialPosts = await getSmartFeed(
    user.id,
    20,
    0 // Start from beginning
  );

  return (
    <div className="flex gap-6 max-w-7xl mx-auto w-full">
      {/* Main Feed */}
      <div className="flex-1 max-w-2xl">
        <div className="border-b border-dark-4 pb-4 mb-6">
          <h1 className='head-text text-left'>Home</h1>
          <div className="flex gap-4 mt-4">
            <button className="text-light-1 font-semibold border-b-2 border-primary-500 pb-2">
              For you
            </button>
            <button className="text-gray-1 hover:text-light-1 transition-colors pb-2">
              Following
            </button>
            <button className="text-gray-1 hover:text-light-1 transition-colors pb-2">
              Trending
            </button>
          </div>
        </div>

        {initialPosts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-heading3-bold text-light-1 mb-4">
              Welcome to Chirp! 👋
            </h2>
            <p className="text-body-regular text-gray-1 mb-6">
              Start following people to see their posts in your feed.
            </p>
            <a 
              href="/explore" 
              className="bg-primary-500 text-white px-6 py-3 rounded-full hover:bg-primary-600 transition-colors"
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
      <div className="w-80 hidden lg:block">
        <TrendingSidebar />
      </div>
    </div>
  );
}

export default Home;