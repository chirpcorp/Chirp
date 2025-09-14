import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";

async function ChatPage() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="mx-auto max-w-md space-y-6">
        {/* Icon */}
        <div className="text-8xl">💬</div>
        
        {/* Title */}
        <h1 className="text-heading2-bold text-light-1">
          Chat Feature Coming Soon! 🔥
        </h1>
        
        {/* Description */}
        <p className="text-body-regular leading-relaxed text-gray-1">
          We&apos;re working hard to bring you an amazing chat experience. 
          Soon you&apos;ll be able to have private conversations, group chats, 
          and real-time messaging with your fellow chirpers.
        </p>
        
        {/* Features list */}
        <div className="rounded-xl border border-dark-4 bg-dark-2 p-6">
          <h3 className="mb-4 text-heading4-medium text-light-1">
            What&apos;s coming:
          </h3>
          <ul className="text-body-regular space-y-3 text-left text-gray-1">
            <li className="flex items-center gap-3">
              <span className="text-primary-500">✨</span>
              Direct messaging with other users
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary-500">✨</span>
              Group chats and community discussions
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary-500">✨</span>
              Media sharing and file attachments
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary-500">✨</span>
              Real-time notifications
            </li>
            <li className="flex items-center gap-3">
              <span className="text-primary-500">✨</span>
              Voice and video calls
            </li>
          </ul>
        </div>
        
        {/* CTA */}
        <div className="pt-4">
          <p className="text-small-regular text-gray-1">
            Want to be notified when chat launches?
          </p>
          <div className="mt-2">
            <button className="hover:bg-primary-600 rounded-full bg-primary-500 px-6 py-3 text-white transition-colors">
              Get Notified
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;