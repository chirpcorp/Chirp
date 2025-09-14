import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import EnhancedPostChirp from "@/components/forms/EnhancedPostChirp";
import { fetchUser } from "@/lib/actions/user.actions";

async function Page() {
  const user = await currentUser();
  if (!user) return null;

  // fetch organization list created by user
  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <>
      <h1 className='head-text'>Create Chirp</h1>

      <EnhancedPostChirp userId={JSON.stringify(userInfo._id)} />
    </>
  );
}

export default Page;
