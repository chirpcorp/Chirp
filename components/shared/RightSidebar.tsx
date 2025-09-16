import { currentUser } from "@clerk/nextjs/server";

import UserCard from "../cards/UserCard";

import { fetchCommunities } from "@/lib/actions/community.actions";
import { fetchUsers } from "@/lib/actions/user.actions";

interface Community {
  id: string;
  name: string;
  username: string;
  image: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  image: string;
}

async function RightSidebar() {
  let user;
  try {
    user = await currentUser();
    if (!user) return null;
  } catch (error) {
    console.error("Error fetching current user in RightSidebar:", error);
    // Add rate limiting protection
    if (error instanceof Error && error.message.includes("Rate")) {
      console.warn("Rate limit exceeded in RightSidebar, returning empty sidebar");
      return (
        <section className='custom-scrollbar rightsidebar'>
          <div className='flex flex-1 flex-col justify-start'>
            <h3 className='text-heading4-medium text-light-1'>
              Suggested Communities
            </h3>
            <p className='mt-4 text-small-regular text-gray-1'>Loading...</p>
          </div>
          <div className='flex flex-1 flex-col justify-start'>
            <h3 className='text-heading4-medium text-light-1'>Similar Minds</h3>
            <p className='mt-4 text-small-regular text-gray-1'>Loading...</p>
          </div>
        </section>
      );
    }
    return null;
  }

  let similarMinds: { users: User[] } = { users: [] };
  try {
    const result = await fetchUsers({
      userId: user.id,
      pageSize: 4,
    });
    similarMinds = result;
  } catch (error) {
    console.error("Error fetching similar minds:", error);
    // Return empty result instead of retrying which causes the same error
    similarMinds = { users: [] };
  }

  let suggestedCommunities: { communities: Community[] } = { communities: [] };
  try {
    const result = await fetchCommunities({ 
      pageSize: 4,
      currentUserId: user.id 
    });
    suggestedCommunities = result;
  } catch (error) {
    console.error("Error fetching suggested communities:", error);
    // Return empty result instead of retrying which causes the same error
    suggestedCommunities = { communities: [] };
  }

  return (
    <section className='custom-scrollbar rightsidebar'>
      <div className='flex flex-1 flex-col justify-start'>
        <h3 className='text-heading4-medium text-light-1'>
          Suggested Communities
        </h3>

        <div className='mt-7 flex flex-col gap-9'>
          {suggestedCommunities.communities.length > 0 ? (
            <>
              {suggestedCommunities.communities.map((community: Community) => (
                <UserCard
                  key={community.id}
                  id={community.id}
                  name={community.name}
                  username={community.username}
                  imgUrl={community.image}
                  personType='Community'
                />
              ))}
            </>
          ) : (
            <p className='!text-base-regular text-light-3'>
              No communities yet
            </p>
          )}
        </div>
      </div>

      <div className='flex flex-1 flex-col justify-start'>
        <h3 className='text-heading4-medium text-light-1'>Similar Minds</h3>
        <div className='mt-7 flex flex-col gap-10'>
          {similarMinds.users.length > 0 ? (
            <>
              {similarMinds.users.map((person: User) => (
                <UserCard
                  key={person.id}
                  id={person.id}
                  name={person.name}
                  username={person.username}
                  imgUrl={person.image}
                  personType='User'
                />
              ))}
            </>
          ) : (
            <p className='!text-base-regular text-light-3'>No users yet</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default RightSidebar;