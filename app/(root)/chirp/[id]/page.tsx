import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Comment from "@/components/forms/Comment";
import ChirpCard from "@/components/cards/ChirpCard";
import { fetchUser } from "@/lib/actions/user.actions";
import { fetchChirpById } from "@/lib/actions/chirp.actions";

export const revalidate = 0;

// Update params type to Promise and await it
async function page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return null;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const chirp = await fetchChirpById(id, user.id);

  return (
    <section className='relative'>
      <div>
        <ChirpCard
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
          likes={chirp.likes || []}
          shares={chirp.shares || []}
          attachments={chirp.attachments || []}
          isLikedByCurrentUser={chirp.isLikedByCurrentUser || false}
        />
      </div>

      <div className='mt-7'>
        <Comment
          chirpId={id}
          currentUserImg={user.imageUrl}
          currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>

      <div className='mt-10'>
        {chirp.children.map((childItem: any) => (
          <ChirpCard
            key={childItem._id}
            id={childItem._id}
            currentUserId={user.id}
            parentId={childItem.parentId}
            content={childItem.text}
            author={childItem.author}
            community={childItem.community}
            createdAt={childItem.createdAt}
            comments={childItem.children}
            hashtags={childItem.hashtags || []}
            mentions={childItem.mentions || []}
            likes={childItem.likes || []}
            shares={childItem.shares || []}
            attachments={childItem.attachments || []}
            isLikedByCurrentUser={childItem.isLikedByCurrentUser || false}
            isComment
          />
        ))}
      </div>
    </section>
  );
}

export default page;