"use client";

import { useState } from "react";
import { updateUserPrivacy } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [whoCanSeePosts, setWhoCanSeePosts] = useState("everyone");
  const [whoCanSeeProfile, setWhoCanSeeProfile] = useState("everyone");
  const [whoCanDm, setWhoCanDm] = useState("everyone");
  const [whoCanReply, setWhoCanReply] = useState("everyone");
  const [whoCanMention, setWhoCanMention] = useState("everyone");

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
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-heading4-medium text-light-1">
          Account Privacy
        </h3>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="mb-2 text-body-semibold text-light-1">Private Account</h4>
              <p className="mb-3 text-small-regular text-gray-1">
                When your account is private, only approved followers can see your posts, followers, and following lists.
              </p>
              <div className="rounded-lg border-l-4 border-primary-500 bg-dark-3 p-4">
                <h5 className="mb-2 text-small-semibold text-light-1">What happens when you make your account private:</h5>
                <ul className="space-y-1 text-small-regular text-gray-1">
                  <li>• Your posts will only be visible to approved followers</li>
                  <li>• People will need to request to follow you</li>
                  <li>• A lock icon will appear next to your username</li>
                  <li>• Your profile will show limited information to non-followers</li>
                </ul>
              </div>
            </div>
            <label className="relative ml-6 inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={isPrivate}
                disabled={loading}
                onChange={(e) => handlePrivacyToggle(e.target.checked)}
              />
              <div className="peer-checked:bg-primary-600 peer-focus:ring-primary-300 peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Who Can See Your Content */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-heading4-medium text-light-1">
          Who Can See Your Content
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Posts and Replies</p>
              <p className="text-small-regular text-gray-1">Control who can see your posts and replies</p>
            </div>
            <Select value={whoCanSeePosts} onValueChange={setWhoCanSeePosts}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers only</SelectItem>
                <SelectItem value="mentioned">People you mention</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Profile Information</p>
              <p className="text-small-regular text-gray-1">Who can see your bio, location, and website</p>
            </div>
            <Select value={whoCanSeeProfile} onValueChange={setWhoCanSeeProfile}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Who Can Interact */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-heading4-medium text-light-1">
          Who Can Interact With You
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Direct Messages</p>
              <p className="text-small-regular text-gray-1">Who can send you direct messages</p>
            </div>
            <Select value={whoCanDm} onValueChange={setWhoCanDm}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers only</SelectItem>
                <SelectItem value="none">No one</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Reply to Posts</p>
              <p className="text-small-regular text-gray-1">Who can reply to your posts</p>
            </div>
            <Select value={whoCanReply} onValueChange={setWhoCanReply}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers only</SelectItem>
                <SelectItem value="mentioned">People you mention</SelectItem>
                <SelectItem value="none">No one</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-medium text-light-1">Mentions</p>
              <p className="text-small-regular text-gray-1">Who can mention you in posts</p>
            </div>
            <Select value={whoCanMention} onValueChange={setWhoCanMention}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers only</SelectItem>
                <SelectItem value="none">No one</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Blocked and Restricted */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-heading4-medium text-light-1">
          Blocked and Restricted Accounts
        </h3>
        <div className="space-y-4">
          <button className="w-full rounded-lg bg-dark-3 p-4 text-left transition-colors hover:bg-dark-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-medium text-light-1">Blocked Accounts</p>
                <p className="text-small-regular text-gray-1">Manage accounts you&apos;ve blocked</p>
              </div>
              <span className="text-gray-1">→</span>
            </div>
          </button>

          <button className="w-full rounded-lg bg-dark-3 p-4 text-left transition-colors hover:bg-dark-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-medium text-light-1">Muted Accounts</p>
                <p className="text-small-regular text-gray-1">Accounts you&apos;ve muted</p>
              </div>
              <span className="text-gray-1">→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="hover:bg-primary-600 bg-primary-500">
          Save Changes
        </Button>
      </div>
    </div>
  );
}