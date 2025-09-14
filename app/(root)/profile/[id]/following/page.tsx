import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchUser, fetchUserFollowing } from "@/lib/actions/user.actions";
import UserCard from "@/components/cards/UserCard";

async function FollowingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return null;

  const { id } = await params;
  const userInfo = await fetchUser(id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const following = await fetchUserFollowing(id);

  return (
    <section>
      <div className='mb-6 flex items-center gap-3'>
        <Link href={`/profile/${id}`}>
          <Image
            src='/assets/back.svg'
            alt='back'
            width={24}
            height={24}
            className='cursor-pointer'
          />
        </Link>
        <div>
          <h1 className='head-text'>{userInfo.name}</h1>
          <p className='text-gray-1'>Following</p>
        </div>
      </div>

      <div className='mt-9 flex flex-col gap-4'>
        {following.length === 0 ? (
          <p className='no-result'>Not following anyone yet</p>
        ) : (
          following.map((followedUser: any) => (
            <UserCard
              key={followedUser._id}
              id={followedUser.id}
              name={followedUser.name}
              username={followedUser.username}
              imgUrl={followedUser.image}
              personType='User'
            />
          ))
        )}
      </div>
    </section>
  );
}

export default FollowingPage;