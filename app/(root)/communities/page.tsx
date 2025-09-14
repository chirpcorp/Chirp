import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import Searchbar from "@/components/shared/Searchbar";
import Pagination from "@/components/shared/Pagination";
import CommunityCard from "@/components/cards/CommunityCard";

import { fetchUser } from "@/lib/actions/user.actions";
import { fetchCommunities } from "@/lib/actions/community.actions";

async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const resolvedSearchParams = await searchParams;
  const result = await fetchCommunities({
    searchString: resolvedSearchParams.q,
    pageNumber: resolvedSearchParams?.page ? +resolvedSearchParams.page : 1,
    pageSize: 25,
    currentUserId: user.id, // Pass current user ID for privacy-aware filtering
  });

  return (
    <>
      <div className='flex items-center justify-between'>
        <h1 className='head-text'>Communities</h1>
        <Link href='/communities/create'>
          <Button className='hover:bg-primary-600 bg-primary-500'>
            Create Community
          </Button>
        </Link>
      </div>

      <div className='mt-5'>
        <Searchbar routeType='communities' />
      </div>

      <section className='mt-9 flex flex-wrap gap-4'>
        {result.communities.length === 0 ? (
          <p className='no-result'>No Result</p>
        ) : (
          <>
            {result.communities.map((community) => (
              <CommunityCard
                key={community.id}
                id={community.id}
                name={community.name}
                username={community.username}
                imgUrl={community.image}
                description={community.description}
                isPrivate={community.isPrivate}
                memberCount={community.memberCount}
                postCount={community.postCount}
                tags={community.tags}
                isMember={community.isMember}
                userRole={community.userRole}
                showMembers={community.showMembers}
                creator={community.creator || undefined}
              />
            ))}
          </>
        )}
      </section>

      <Pagination
        path='communities'
        pageNumber={resolvedSearchParams?.page ? +resolvedSearchParams.page : 1}
        isNext={result.isNext}
      />
    </>
  );
}

export default Page;
