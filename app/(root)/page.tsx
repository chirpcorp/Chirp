import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import TrendingSidebar from "@/components/shared/TrendingSidebar";
import InfiniteFeed from "@/components/feed/InfiniteFeed";
import { getSmartFeed } from "@/lib/algorithms/postRanking";

import { fetchUser } from "@/lib/actions/user.actions";

async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
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
    <div className="mx-auto flex w-full max-w-7xl gap-6">
      {/* Main Feed */}
      <div className="max-w-2xl flex-1">
        <div className="mb-6 border-b border-dark-4 pb-4">
          <h1 className='head-text text-left'>Home</h1>
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