"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateCommunityInfo, deleteCommunity } from "@/lib/actions/community.actions";

interface Community {
  id: string;
  name: string;
  username: string;
  description?: string;
  image: string;
  coverImage?: string;
  isPrivate: boolean;
  tags?: string[];
  rules?: { title: string; description: string }[];
  settings: {
    allowMemberPosts: boolean;
    requireApprovalForPosts: boolean;
    allowMemberInvites: boolean;
    showMemberList: boolean;
  };
}

interface Props {
  community: Community;
  currentUserId: string;
  isCreator: boolean;
}

function CommunitySettings({ community, currentUserId, isCreator }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: community.name,
    username: community.username,
    description: community.description || "",
    isPrivate: community.isPrivate,
    tags: community.tags?.join(", ") || "",
    allowMemberPosts: community.settings.allowMemberPosts,
    requireApprovalForPosts: community.settings.requireApprovalForPosts,
    allowMemberInvites: community.settings.allowMemberInvites,
    showMemberList: community.settings.showMemberList,
  });

  // Rules state
  const [rules, setRules] = useState(community.rules || []);
  const [newRule, setNewRule] = useState({ title: "", description: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAddRule = () => {
    if (newRule.title.trim()) {
      setRules(prev => [...prev, { ...newRule }]);
      setNewRule({ title: "", description: "" });
    }
  };

  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await updateCommunityInfo({
        communityId: community.id,
        name: formData.name,
        username: formData.username,
        description: formData.description,
        isPrivate: formData.isPrivate,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
        rules,
        settings: {
          allowMemberPosts: formData.allowMemberPosts,
          requireApprovalForPosts: formData.requireApprovalForPosts,
          allowMemberInvites: formData.allowMemberInvites,
          showMemberList: formData.showMemberList,
        },
        adminId: currentUserId,
        path: `/communities/${community.id}`,
      });
      
      router.refresh();
      alert("Community settings updated successfully!");
    } catch (error) {
      console.error("Error updating community:", error);
      alert("Failed to update community settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (deleteConfirmText !== community.name) {
      alert("Please type the community name exactly to confirm deletion.");
      return;
    }

    setIsLoading(true);
    try {
      await deleteCommunity({
        communityId: community.id,
        creatorId: currentUserId,
        path: "/communities",
      });
      
      router.push("/communities");
      alert("Community deleted successfully.");
    } catch (error) {
      console.error("Error deleting community:", error);
      alert("Failed to delete community. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-heading4-medium text-light-1">Community Settings</h2>

      {/* Basic Information */}
      <div className="bg-dark-2 p-6 rounded-xl">
        <h3 className="text-body-semibold text-light-1 mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-small-semibold text-light-2 mb-2 block">
              Community Name
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-dark-3 border-dark-4 text-light-1"
              placeholder="Enter community name"
            />
          </div>

          <div>
            <label className="text-small-semibold text-light-2 mb-2 block">
              Username (c/{formData.username})
            </label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="bg-dark-3 border-dark-4 text-light-1"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="text-small-semibold text-light-2 mb-2 block">
              Description
            </label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="bg-dark-3 border-dark-4 text-light-1 min-h-[100px]"
              placeholder="Describe your community..."
            />
          </div>

          <div>
            <label className="text-small-semibold text-light-2 mb-2 block">
              Tags (comma-separated)
            </label>
            <Input
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="bg-dark-3 border-dark-4 text-light-1"
              placeholder="technology, discussion, help"
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-dark-2 p-6 rounded-xl">
        <h3 className="text-body-semibold text-light-1 mb-4">Privacy & Permissions</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small-semibold text-light-2">Private Community</p>
              <p className="text-tiny-medium text-gray-1">
                Only members can view posts and content
              </p>
            </div>
            <input
              type="checkbox"
              name="isPrivate"
              checked={formData.isPrivate}
              onChange={handleInputChange}
              className="w-5 h-5 rounded bg-dark-3 border-dark-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-small-semibold text-light-2">Allow Member Posts</p>
              <p className="text-tiny-medium text-gray-1">
                Members can create posts in the community
              </p>
            </div>
            <input
              type="checkbox"
              name="allowMemberPosts"
              checked={formData.allowMemberPosts}
              onChange={handleInputChange}
              className="w-5 h-5 rounded bg-dark-3 border-dark-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-small-semibold text-light-2">Require Post Approval</p>
              <p className="text-tiny-medium text-gray-1">
                Posts need admin approval before being visible
              </p>
            </div>
            <input
              type="checkbox"
              name="requireApprovalForPosts"
              checked={formData.requireApprovalForPosts}
              onChange={handleInputChange}
              className="w-5 h-5 rounded bg-dark-3 border-dark-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-small-semibold text-light-2">Show Member List</p>
              <p className="text-tiny-medium text-gray-1">
                Display the full member list publicly
              </p>
            </div>
            <input
              type="checkbox"
              name="showMemberList"
              checked={formData.showMemberList}
              onChange={handleInputChange}
              className="w-5 h-5 rounded bg-dark-3 border-dark-4"
            />
          </div>
        </div>
      </div>

      {/* Community Rules */}
      <div className="bg-dark-2 p-6 rounded-xl">
        <h3 className="text-body-semibold text-light-1 mb-4">Community Rules</h3>
        
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-start justify-between p-3 bg-dark-3 rounded-lg">
              <div className="flex-1">
                <p className="text-small-semibold text-light-2">{index + 1}. {rule.title}</p>
                {rule.description && (
                  <p className="text-tiny-medium text-gray-1 mt-1">{rule.description}</p>
                )}
              </div>
              <Button
                onClick={() => handleRemoveRule(index)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs ml-3"
              >
                Remove
              </Button>
            </div>
          ))}

          <div className="space-y-3 p-3 bg-dark-3 rounded-lg">
            <Input
              value={newRule.title}
              onChange={(e) => setNewRule(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Rule title"
              className="bg-dark-4 border-dark-4 text-light-1"
            />
            <Textarea
              value={newRule.description}
              onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Rule description (optional)"
              className="bg-dark-4 border-dark-4 text-light-1 min-h-[60px]"
            />
            <Button
              onClick={handleAddRule}
              disabled={!newRule.title.trim()}
              className="bg-primary-500 hover:bg-primary-600 w-full"
            >
              Add Rule
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="bg-primary-500 hover:bg-primary-600 px-8"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>

        {isCreator && (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700 px-8"
          >
            Delete Community
          </Button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-2 p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-heading4-medium text-light-1 mb-4">Delete Community</h3>
            <p className="text-body-regular text-gray-1 mb-4">
              This action cannot be undone. All posts, members, and data will be permanently lost.
            </p>
            <p className="text-small-semibold text-light-2 mb-2">
              Type "{community.name}" to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="bg-dark-3 border-dark-4 text-light-1 mb-4"
              placeholder={community.name}
            />
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCommunity}
                disabled={deleteConfirmText !== community.name || isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Deleting..." : "Delete Forever"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunitySettings;