import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";

async function ChatPage() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="max-w-md mx-auto space-y-6">
        {/* Icon */}
        <div className="text-8xl">💬</div>
        
        {/* Title */}
        <h1 className="text-heading2-bold text-light-1">
          Chat Feature Coming Soon! 🔥
        </h1>
        
        {/* Description */}
        <p className="text-body-regular text-gray-1 leading-relaxed">
          We're working hard to bring you an amazing chat experience. 
          Soon you'll be able to have private conversations, group chats, 
          and real-time messaging with your fellow chirpers.
        </p>
        
        {/* Features list */}
        <div className="bg-dark-2 rounded-xl p-6 border border-dark-4">
          <h3 className="text-heading4-medium text-light-1 mb-4">
            What's coming:
          </h3>
          <ul className="text-left space-y-3 text-body-regular text-gray-1">
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
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-full transition-colors">
              Get Notified
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;