import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { fetchUser } from "@/lib/actions/user.actions";
import AccountProfile from "@/components/forms/AccountProfile";

// Copy paste most of the code as it is from the /onboarding

async function Page() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const userData = {
    id: user.id,
    username: userInfo ? userInfo?.username : user.username,
    name: userInfo ? userInfo?.name : user.firstName ?? "",
    bio: userInfo ? userInfo?.bio : "",
    image: userInfo ? userInfo?.image : user.imageUrl,
    email: userInfo?.email || "",
    website: userInfo?.website || "",
    location: userInfo?.location || "",
    dateOfBirth: userInfo?.dateOfBirth ? userInfo.dateOfBirth.toISOString().split('T')[0] : "",
  };

  return (
    <>
      <h1 className='head-text'>Edit Profile</h1>
      <p className='mt-3 text-base-regular text-light-2'>Make any changes</p>

      <section className='mt-12'>
        <AccountProfile user={userData} btnTitle='Continue' />
      </section>
    </>
  );
}

export default Page;