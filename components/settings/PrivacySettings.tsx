"use client";
"use client";

import { useState } from "react";
import { updateUserPrivacy } from "@/lib/actions/user.actions";

interface UserInfo {
  _id: string;
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  bio: string;
  location: string;
  website: string;
  isPrivate: boolean;
  joinedDate: string;
}

interface Props {
  userInfo: UserInfo;
}

export default function PrivacySettings({ userInfo }: Props) {
  const [isPrivate, setIsPrivate] = useState(userInfo.isPrivate || false);
  const [loading, setLoading] = useState(false);

  const handlePrivacyToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      await updateUserPrivacy(userInfo.id, checked);
      setIsPrivate(checked);
    } catch (error) {
      console.error("Error updating privacy settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Privacy */}
      <div className="bg-dark-2 rounded-xl p-6">
        <h3 className="text-heading4-medium text-light-1 mb-4">
          Account Privacy
        </h3>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-body-semibold text-light-1 mb-2">Private Account</h4>
              <p className="text-small-regular text-gray-1 mb-3">
                When your account is private, only approved followers can see your posts, followers, and following lists.
              </p>
              <div className="bg-dark-3 rounded-lg p-4 border-l-4 border-primary-500">
                <h5 className="text-small-semibold text-light-1 mb-2">What happens when you make your account private:</h5>
                <ul className="text-small-regular text-gray-1 space-y-1">
                  <li>• Your posts will only be visible to approved followers</li>
                  <li>• People will need to request to follow you</li>
                  <li>• A lock icon will appear next to your username</li>
                  <li>• Your profile will show limited information to non-followers</li>
                </ul>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-6">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isPrivate}
                disabled={loading}
                onChange={(e) => handlePrivacyToggle(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Who Can See Your Content */}
      <div className="bg-dark-2 rounded-xl p-6">
        <h3 className="text-heading4-medium text-light-1 mb-4">
          Who Can See Your Content
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Posts and Replies</p>
              <p className="text-small-regular text-gray-1">Control who can see your posts and replies</p>
            </div>
            <select className="bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-light-1">
              <option value="everyone">Everyone</option>
              <option value="followers">Followers only</option>
              <option value="mentioned">People you mention</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Profile Information</p>
              <p className="text-small-regular text-gray-1">Who can see your bio, location, and website</p>
            </div>
            <select className="bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-light-1">
              <option value="everyone">Everyone</option>
              <option value="followers">Followers only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Who Can Interact */}
      <div className="bg-dark-2 rounded-xl p-6">
        <h3 className="text-heading4-medium text-light-1 mb-4">
          Who Can Interact With You
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Direct Messages</p>
              <p className="text-small-regular text-gray-1">Who can send you direct messages</p>
            </div>
            <select className="bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-light-1">
              <option value="everyone">Everyone</option>
              <option value="followers">Followers only</option>
              <option value="none">No one</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Reply to Posts</p>
              <p className="text-small-regular text-gray-1">Who can reply to your posts</p>
            </div>
            <select className="bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-light-1">
              <option value="everyone">Everyone</option>
              <option value="followers">Followers only</option>
              <option value="mentioned">People you mention</option>
              <option value="none">No one</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-body-medium text-light-1">Mentions</p>
              <p className="text-small-regular text-gray-1">Who can mention you in posts</p>
            </div>
            <select className="bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-light-1">
              <option value="everyone">Everyone</option>
              <option value="followers">Followers only</option>
              <option value="none">No one</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blocked and Restricted */}
      <div className="bg-dark-2 rounded-xl p-6">
        <h3 className="text-heading4-medium text-light-1 mb-4">
          Blocked and Restricted Accounts
        </h3>
        <div className="space-y-4">
          <button className="w-full text-left p-4 bg-dark-3 rounded-lg hover:bg-dark-4 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-body-medium text-light-1">Blocked Accounts</p>
                <p className="text-small-regular text-gray-1">Manage accounts you've blocked</p>
              </div>
              <span className="text-gray-1">→</span>
            </div>
          </button>

          <button className="w-full text-left p-4 bg-dark-3 rounded-lg hover:bg-dark-4 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-body-medium text-light-1">Muted Accounts</p>
                <p className="text-small-regular text-gray-1">Accounts you've muted</p>
              </div>
              <span className="text-gray-1">→</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}