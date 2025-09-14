import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { fetchUser, fetchUserFollowers } from "@/lib/actions/user.actions";
import UserCard from "@/components/cards/UserCard";

async function FollowersPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return null;

  const { id } = params;

  const userInfo = await fetchUser(id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const followers = await fetchUserFollowers(id);

  return (
    <section>
      <div className='flex items-center gap-3 mb-6'>
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
          <p className='text-gray-1'>Followers</p>
        </div>
      </div>

      <div className='mt-9 flex flex-col gap-4'>
        {followers.length === 0 ? (
          <p className='no-result'>No followers yet</p>
        ) : (
          followers.map((follower: any) => (
            <UserCard
              key={follower._id}
              id={follower.id}
              name={follower.name}
              username={follower.username}
              imgUrl={follower.image}
              personType='User'
            />
          ))
        )}
      </div>
    </section>
  );
}

export default FollowersPage;