import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { fetchUser } from "@/lib/actions/user.actions";
import AccountProfile from "@/components/forms/AccountProfile";

async function Page() {
  try {
    const user = await currentUser();
    if (!user) {
      console.error("No user found in onboarding page");
      return <div>Error: No user found. Please try signing in again.</div>;
    }

    let userInfo = null;
    let dbConnectionFailed = false;
    try {
      userInfo = await fetchUser(user.id);
    } catch (error) {
      console.error("Error fetching user in onboarding:", error);
      // Check if it's a database connection error
      if (error instanceof Error && error.message.includes("MongoDB")) {
        dbConnectionFailed = true;
      }
      // Continue with basic user info if fetch fails
    }
    
    // Only redirect if we successfully fetched user info and they're onboarded
    // If database connection failed, we should allow them to stay on onboarding
    if (userInfo?.onboarded && !dbConnectionFailed) redirect("/");

    const userData = {
      id: user.id,
      username: userInfo?.username || user.username || "",
      name: userInfo?.name || user.firstName || user.username || "",
      bio: userInfo?.bio || "",
      image: userInfo?.image || user.imageUrl || "",
    };

    return (
      <main className='mx-auto flex max-w-3xl flex-col justify-start px-10 py-20'>
        <h1 className='head-text'>Welcome to Chirp!</h1>
        {dbConnectionFailed && (
          <div className="mb-4 rounded bg-yellow-100 p-4 text-yellow-800">
            <p>Warning: Database connection failed. You can still complete onboarding, but some features may be limited until the connection is restored.</p>
          </div>
        )}
        <p className='mt-3 text-base-regular text-light-2'>
          Complete your profile now, to use Chirp.
        </p>

        <section className='mt-9 bg-dark-2 p-10'>
          <AccountProfile user={userData} btnTitle='Continue' />
        </section>
      </main>
    );
  } catch (error) {
    console.error("Error in onboarding page:", error);
    return <div>Error loading onboarding page. Please try again.</div>;
  }
}

export default Page;