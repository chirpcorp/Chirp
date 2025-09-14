import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";

import { profileTabs } from "@/constants";

import ChirpsTab from "@/components/shared/ChirpsTab";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { fetchUser, getUserRelationship } from "@/lib/actions/user.actions";

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return null;

  // Await the params in Next.js 15 as per the documentation
  const { id } = await params;

  let userInfo;
  try {
    userInfo = await fetchUser(id);
  } catch (error) {
    // If user is not found, redirect to home page
    console.error("Error fetching user:", error);
    redirect("/");
  }

  if (!userInfo?.onboarded) redirect("/onboarding");

  // Get relationship data if viewing another user's profile
  const relationship = user.id !== id 
    ? await getUserRelationship(user.id, id)
    : null;

  // Check if content should be hidden (private account + not following + not own profile)
  const isOwnProfile = user.id === id;
  const isFollowing = relationship?.isFollowing || false;
  const shouldHideContent = userInfo.isPrivate && !isOwnProfile && !isFollowing;

  return (
    <section>
      <ProfileHeader
        accountId={userInfo.id}
        authUserId={user.id}
        name={userInfo.name}
        username={userInfo.username}
        imgUrl={userInfo.image}
        bio={userInfo.bio}
        email={userInfo.email}
        website={userInfo.website}
        location={userInfo.location}
        joinedDate={userInfo.joinedDate}
        followersCount={relationship?.followersCount || userInfo.followers?.length || 0}
        followingCount={relationship?.followingCount || userInfo.following?.length || 0}
        isFollowing={relationship?.isFollowing || false}
        isBlocked={relationship?.isBlocked || false}
        isPrivate={userInfo.isPrivate || false}
        hasPendingRequest={relationship?.hasPendingRequest || false}
      />

      {shouldHideContent ? (
        <div className='mt-9 text-center py-16'>
          <div className='flex flex-col items-center gap-4'>
            <Image
              src='/assets/lock.svg'
              alt='private account'
              width={48}
              height={48}
              className='text-gray-1 opacity-70'
            />
            <h3 className='text-heading4-medium text-light-1'>This account is private</h3>
            <p className='text-base-regular text-gray-1 max-w-md'>
              Follow @{userInfo.username} to see their photos, videos and activity.
            </p>
          </div>
        </div>
      ) : (
        <div className='mt-9'>
          <Tabs defaultValue='chirps' className='w-full'>
            <TabsList className='tab'>
              {profileTabs.map((tab) => (
                <TabsTrigger key={tab.label} value={tab.value} className='tab'>
                  <Image
                    src={tab.icon}
                    alt={tab.label}
                    width={24}
                    height={24}
                    className='object-contain'
                  />
                  <p className='max-sm:hidden'>{tab.label}</p>

                  {tab.label === "Chirps" && (
                    <p className='ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2'>
                      {userInfo.chirps.length}
                    </p>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {profileTabs.map((tab) => (
              <TabsContent
                key={`content-${tab.label}`}
                value={tab.value}
                className='w-full text-light-1'
              >
                {/* @ts-ignore */}
                <ChirpsTab
                  currentUserId={user.id}
                  accountId={userInfo.id}
                  accountType='User'
                  tabType={tab.value}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </section>
  );
}
export default Page;