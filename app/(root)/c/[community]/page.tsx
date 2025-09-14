import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { fetchUser } from "@/lib/actions/user.actions";
import { fetchCommunityDetailsByUsername } from "@/lib/actions/community.actions";
import { fetchChirpsByCommunityTag } from "@/lib/actions/chirp.actions";
import ChirpCard from "@/components/cards/ChirpCard";

async function CommunityTagPage({ params }: { params: { community: string } }) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const { community } = params;
  const communityUsername = community;

  try {
    // Try to fetch community details first
    const communityDetails = await fetchCommunityDetailsByUsername(communityUsername, user.id);
    const result = await fetchChirpsByCommunityTag(communityUsername, user.id);

    return (
      <section>
        <div className="border-b border-dark-4 pb-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {communityDetails.image && (
              <img 
                src={communityDetails.image} 
                alt={communityDetails.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="head-text">c/{communityUsername}</h1>
              <p className="text-body-medium text-light-1">{communityDetails.name}</p>
              {communityDetails.description && (
                <p className="text-body-regular text-gray-1 mt-2">{communityDetails.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-small-medium text-gray-1">
            <span>{communityDetails.memberCount || 0} members</span>
            <span>{result.chirps.length} posts</span>
          </div>
        </div>

        <div className='mt-9 flex flex-col gap-10'>
          {result.chirps.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-heading3-bold text-light-1 mb-4">
                No posts yet in c/{communityUsername}
              </h2>
              <p className="text-body-regular text-gray-1">
                Be the first to post something using c/{communityUsername} in your chirp!
              </p>
            </div>
          ) : (
            <>
              {result.chirps.map((chirp: any) => (
                <ChirpCard
                  key={chirp._id}
                  id={chirp._id}
                  currentUserId={user.id}
                  parentId={chirp.parentId}
                  content={chirp.text}
                  author={chirp.author}
                  community={chirp.community}
                  createdAt={chirp.createdAt}
                  comments={chirp.children}
                  hashtags={chirp.hashtags || []}
                  mentions={chirp.mentions || []}
                  communityTags={chirp.communityTags || []}
                  likes={chirp.likes || []}
                  shares={chirp.shares || []}
                  attachments={chirp.attachments || []}
                  isLikedByCurrentUser={chirp.isLikedByCurrentUser || false}
                />
              ))}
            </>
          )}
        </div>
      </section>
    );
  } catch (error) {
    // Community might not exist, show a generic page
    return (
      <section>
        <div className="border-b border-dark-4 pb-4 mb-6">
          <h1 className="head-text">c/{communityUsername}</h1>
          <p className="text-body-regular text-gray-1 mt-2">
            Community not found or no posts tagged with this community yet.
          </p>
        </div>

        <div className="text-center py-12">
          <h2 className="text-heading3-bold text-light-1 mb-4">
            No posts found
          </h2>
          <p className="text-body-regular text-gray-1">
            Start using c/{communityUsername} in your chirps to create this community!
          </p>
        </div>
      </section>
    );
  }
}

export default CommunityTagPage;