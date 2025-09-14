import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { fetchUser, getActivity } from "@/lib/actions/user.actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowRequests from "@/components/activity/FollowRequests";

async function Page() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo) redirect("/");
  if (!userInfo?.onboarded) redirect("/onboarding");

  const activity = await getActivity(userInfo._id);

  return (
    <div className="w-full">
      <h1 className='head-text mb-6'>Activity</h1>

      <Tabs defaultValue="mentions" className="w-full">
        <TabsList className="tab mb-6">
          <TabsTrigger value="mentions" className="tab">
            <Image
              src="/assets/reply.svg"
              alt="mentions"
              width={24}
              height={24}
              className="object-contain"
            />
            <p className="max-sm:hidden">Mentions</p>
            {activity.length > 0 && (
              <span className="ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2">
                {activity.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="tab">
            <Image
              src="/assets/heart.svg"
              alt="follow requests"
              width={24}
              height={24}
              className="object-contain"
            />
            <p className="max-sm:hidden">Follow Requests</p>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="mentions" className="w-full text-light-1">
          <section className='flex flex-col gap-5'>
            {activity.length > 0 ? (
              <>
                {activity.map((activity) => (
                  <Link key={activity._id} href={`/chirp/${activity.parentId}`}>
                    <article className='activity-card'>
                      <Image
                        src={activity.author.image}
                        alt='user_logo'
                        width={20}
                        height={20}
                        className='rounded-full object-cover'
                      />
                      <p className='!text-small-regular text-light-1'>
                        <span className='mr-1 text-primary-500'>
                          {activity.author.name}
                        </span>{" "}
                        replied to your chirp
                      </p>
                    </article>
                  </Link>
                ))}
              </>
            ) : (
              <p className='!text-base-regular text-light-3 text-center py-8'>No activity yet</p>
            )}
          </section>
        </TabsContent>
        
        <TabsContent value="requests" className="w-full text-light-1">
          <FollowRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Page;
