import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function ProfilePage() {
  const user = await currentUser();
  
  if (!user) {
    // If user is not logged in, redirect to home
    redirect("/");
  }
  
  // Redirect to the user's profile page
  redirect(`/profile/${user.id}`);
}

export default ProfilePage;