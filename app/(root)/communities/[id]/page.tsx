import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

import UserCard from "@/components/cards/UserCard";
import ChirpsTab from "@/components/shared/ChirpsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CommunityHeader from "@/components/shared/CommunityHeader";
import CommunityAdminPanel from "@/components/community/CommunityAdminPanel";
import CommunityMembersList from "@/components/community/CommunityMembersList";
import CommunityJoinRequests from "@/components/community/CommunityJoinRequests";
import CommunitySettings from "@/components/community/CommunitySettings";
import EnhancedPostChirp from "@/components/forms/EnhancedPostChirp";

import { fetchCommunityDetails } from "@/lib/actions/community.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { joinCommunity, leaveCommunity } from "@/lib/actions/community.actions";

// Update params type to Promise and await it
async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const { id } = await params;

  try {
    const communityDetails = await fetchCommunityDetails(id, user.id);
    
    if (!communityDetails) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-heading2-bold text-light-1">Community not found</h1>
          <p className="text-body-regular text-gray-1 mt-2">This community doesn't exist or has been deleted.</p>
        </div>
      );
    }

    // Check if community is private and user is not a member
    if (communityDetails.isPrivate && !communityDetails.isMember && !communityDetails.isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex items-center gap-4 mb-6">
            <Image
              src={communityDetails.image}
              alt={communityDetails.name}
              width={80}
              height={80}
              className="rounded-lg object-cover"
            />
            <div>
              <h1 className="text-heading2-bold text-light-1">{communityDetails.name}</h1>
              <p className="text-body-regular text-gray-1 flex items-center gap-2">
                <Image src='/assets/lock.svg' alt='private' width={16} height={16} />
                Private Community
              </p>
            </div>
          </div>
          <p className="text-body-regular text-gray-1 text-center mb-6">
            This is a private community. You need to be a member to view its content.
          </p>
          <Button 
            className="bg-primary-500 hover:bg-primary-600"
            onClick={async () => {
              'use server';
              await joinCommunity({ 
                communityId: id, 
                userId: user.id, 
                path: `/communities/${id}` 
              });
            }}
          >
            Request to Join
          </Button>
        </div>
      );
    }

    // Define tabs based on user role
    const baseTabs = [
      { label: "Posts", value: "chirps", icon: "/assets/reply.svg" },
      { label: "Members", value: "members", icon: "/assets/members.svg" },
    ];

    const adminTabs = [
      { label: "Join Requests", value: "requests", icon: "/assets/request.svg" },
      { label: "Settings", value: "settings", icon: "/assets/edit.svg" },
    ];

    const tabs = communityDetails.isAdmin || communityDetails.isCreator 
      ? [...baseTabs, ...adminTabs] 
      : baseTabs;

    return (
      <section>
        <CommunityHeader
          communityId={communityDetails.id}
          currentUserId={user.id}
          name={communityDetails.name}
          username={communityDetails.username}
          description={communityDetails.description}
          image={communityDetails.image}
          coverImage={communityDetails.coverImage}
          isPrivate={communityDetails.isPrivate}
          memberCount={communityDetails.memberCount}
          postCount={communityDetails.postCount}
          tags={communityDetails.tags}
          rules={communityDetails.rules}
          createdAt={communityDetails.createdAt}
          creator={communityDetails.creator}
          currentUserRole={communityDetails.currentUserRole}
          isMember={communityDetails.isMember}
          isAdmin={communityDetails.isAdmin}
          isCreator={communityDetails.isCreator}
        />

        {/* Community-specific chirp creation for members */}
        {communityDetails.isMember && (
          <div className="mt-6">
            <EnhancedPostChirp 
              userId={JSON.stringify(userInfo._id)}
            />
          </div>
        )}

        <div className='mt-9'>
          <Tabs defaultValue='chirps' className='w-full'>
            <TabsList className='tab'>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.label} value={tab.value} className='tab'>
                  <Image
                    src={tab.icon}
                    alt={tab.label}
                    width={24}
                    height={24}
                    className='object-contain'
                  />
                  <p className='max-sm:hidden'>{tab.label}</p>

                  {tab.label === "Posts" && (
                    <p className='ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2'>
                      {communityDetails.postCount || 0}
                    </p>
                  )}
                  {tab.label === "Members" && (
                    <p className='ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2'>
                      {communityDetails.memberCount}
                    </p>
                  )}
                  {tab.label === "Join Requests" && (communityDetails as any).joinRequests && (
                    <p className='ml-1 rounded-sm bg-red-500 px-2 py-1 !text-tiny-medium text-white'>
                      {(communityDetails as any).joinRequests.length}
                    </p>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='chirps' className='w-full text-light-1'>
              <ChirpsTab
                currentUserId={user.id}
                accountId={communityDetails.id}
                accountType='Community'
              />
            </TabsContent>

            <TabsContent value='members' className='mt-9 w-full text-light-1'>
              <CommunityMembersList
                members={(communityDetails as any).members || []}
                currentUserId={user.id}
                communityId={communityDetails.id}
                isAdmin={communityDetails.isAdmin}
                isCreator={communityDetails.isCreator}
                currentUserRole={communityDetails.currentUserRole}
              />
            </TabsContent>

            {(communityDetails.isAdmin || communityDetails.isCreator) && (
              <TabsContent value='requests' className='mt-9 w-full text-light-1'>
                <CommunityJoinRequests
                  requests={(communityDetails as any).joinRequests || []}
                  currentUserId={user.id}
                  communityId={communityDetails.id}
                />
              </TabsContent>
            )}

            {(communityDetails.isAdmin || communityDetails.isCreator) && (
              <TabsContent value='settings' className='mt-9 w-full text-light-1'>
                <CommunitySettings
                  community={communityDetails}
                  currentUserId={user.id}
                  isCreator={communityDetails.isCreator}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Error loading community:', error);
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-heading2-bold text-light-1">Error loading community</h1>
        <p className="text-body-regular text-gray-1 mt-2">Please try again later.</p>
      </div>
    );
  }
}

export default Page;