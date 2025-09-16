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

  // Ensure dateOfBirth is properly formatted
  let formattedDateOfBirth = "";
  if (userInfo?.dateOfBirth) {
    if (typeof userInfo.dateOfBirth === 'string') {
      // If it's already a string, try to parse it as a date
      const date = new Date(userInfo.dateOfBirth);
      if (!isNaN(date.getTime())) {
        formattedDateOfBirth = date.toISOString().split('T')[0];
      }
    } else if (userInfo.dateOfBirth instanceof Date) {
      // If it's already a Date object
      formattedDateOfBirth = userInfo.dateOfBirth.toISOString().split('T')[0];
    }
  }

  const userData = {
    id: user.id,
    username: userInfo ? userInfo?.username : user.username,
    name: userInfo ? userInfo?.name : user.firstName ?? "",
    bio: userInfo ? userInfo?.bio : "",
    image: userInfo ? userInfo?.image : user.imageUrl,
    email: userInfo?.email || "",
    website: userInfo?.website || "",
    location: userInfo?.location || "",
    dateOfBirth: formattedDateOfBirth,
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