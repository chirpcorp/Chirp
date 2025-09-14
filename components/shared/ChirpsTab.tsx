
import { fetchCommunityPosts } from "@/lib/actions/community.actions";
import { fetchUserPosts, fetchUserReplies } from "@/lib/actions/user.actions";

import ChirpCard from "../cards/ChirpCard";

interface Result {
  name: string;
  image: string;
  id: string;
  chirps: {
    _id: string;
    text: string;
    parentId: string | null;
    author: {
      name: string;
      image: string;
      id: string;
    };
    community: {
      id: string;
      name: string;
      image: string;
    } | null;
    createdAt: string;
    children: {
      author: {
        image: string;
      };
    }[];
  }[];
}

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
  tabType?: string; // New prop to determine which tab we're showing
}

async function ChirpsTab({ currentUserId, accountId, accountType, tabType = "chirps" }: Props) {
  let result: Result | any = { chirps: [] };

  try {
    if (accountType === "Community") {
      result = await fetchCommunityPosts(accountId, currentUserId);
    } else {
      // For user profiles, handle different tab types
      if (tabType === "replies") {
        result = await fetchUserReplies(accountId, currentUserId);
      } else {
        result = await fetchUserPosts(accountId, currentUserId);
      }
    }
  } catch (error) {
    console.error("Error fetching chirps:", error);
    // Use empty result instead of throwing error
    result = { chirps: [] };
  }

  // Handle case where result is null or undefined
  if (!result) {
    result = { chirps: [] };
  }

  // Handle different result structures
  const chirps = result.chirps || [];
  const userInfo = accountType === "User" && result.name ? {
    name: result.name,
    image: result.image,
    id: result.id
  } : null;

  return (
    <section className='mt-9 flex flex-col gap-10'>
      {chirps.length === 0 ? (
        <p className='no-result'>
          {tabType === "replies" ? "No replies yet" : "No chirps yet"}
        </p>
      ) : (
        chirps.map((chirp: any) => (
          <ChirpCard
            key={chirp._id}
            id={chirp._id}
            currentUserId={currentUserId}
            parentId={chirp.parentId}
            content={chirp.text}
            author={
              userInfo || {
                    name: chirp.author.name,
                    image: chirp.author.image,
                    id: chirp.author.id,
                  }
            }
            community={
              accountType === "Community"
                ? { name: result.name, id: result.id, image: result.image }
                : chirp.community
            }
            createdAt={chirp.createdAt}
            comments={chirp.children || []}
            hashtags={chirp.hashtags || []}
            mentions={chirp.mentions || []}
            communityTags={chirp.communityTags || []}
            likes={chirp.likes || []}
            shares={chirp.shares || []}
            attachments={chirp.attachments || []}
            isLikedByCurrentUser={chirp.isLikedByCurrentUser || false}
          />
        ))
      )}
    </section>
  );
}

export default ChirpsTab;