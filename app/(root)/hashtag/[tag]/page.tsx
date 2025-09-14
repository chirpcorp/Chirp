import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { fetchUser } from "@/lib/actions/user.actions";
import { fetchChirpsByHashtag } from "@/lib/actions/chirp.actions";
import ChirpCard from "@/components/cards/ChirpCard";

interface Props {
  params: {
    tag: string;
  };
}

async function Page({ params }: Props) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const { tag } = params;
  const hashtag = decodeURIComponent(tag);
  const result = await fetchChirpsByHashtag(hashtag, user.id);

  return (
    <section>
      <h1 className='head-text'>#{hashtag}</h1>
      <p className='mt-3 text-base-regular text-light-2'>
        Chirps containing #{hashtag}
      </p>

      <div className='mt-9 flex flex-col gap-10'>
        {result.chirps.length === 0 ? (
          <p className='no-result'>No chirps found for this hashtag</p>
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
}

export default Page;