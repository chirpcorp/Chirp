import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { fetchUser } from "@/lib/actions/user.actions";
import CreateCommunityForm from "@/components/forms/CreateCommunityForm";

async function Page() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <>
      <h1 className='head-text'>Create Community</h1>
      <p className='mt-3 text-base-regular text-light-2'>
        Start your own community and bring people together
      </p>

      <section className='mt-12'>
        <CreateCommunityForm userId={userInfo._id.toString()} />
      </section>
    </>
  );
}

export default Page;