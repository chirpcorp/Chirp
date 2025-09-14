"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing";


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
  const { startUpload } = useUploadThing("media");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState(community.image);

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

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const fileReader = new FileReader();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFiles(Array.from(e.target.files));

      if (!file.type.includes("image")) {
        alert("Please select an image file (JPEG, PNG, GIF, etc.)");
        return;
      }

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        setImagePreview(imageDataUrl);
      };

      fileReader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    const fileInput = document.getElementById('community-image-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

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
      let imageUrl = community.image;
      
      // Handle image upload if files are selected
      if (files.length > 0) {
        console.log("Uploading community image...");
        const imgRes = await startUpload(files);
        
        if (imgRes && imgRes[0]?.url) {
          console.log("Image upload successful:", imgRes[0].url);
          imageUrl = imgRes[0].url;
        } else {
          console.warn("Image upload failed, keeping current image");
        }
      }

      await updateCommunityInfo({
        communityId: community.id,
        name: formData.name,
        username: formData.username,
        description: formData.description,
        image: imageUrl,
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

      {/* Community Image */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-body-semibold text-light-1">Community Image</h3>
        
        <div className="flex items-center gap-6">
          <div 
            className="relative cursor-pointer"
            onClick={handleImageClick}
          >
            <Image
              src={imagePreview}
              alt="Community image"
              width={96}
              height={96}
              className="rounded-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-30 opacity-0 transition-opacity hover:opacity-100">
              <span className="text-sm text-white">Change</span>
            </div>
          </div>
          
          <div>
            <p className="mb-2 text-small-regular text-light-2">
              Click on the image to upload a new one
            </p>
            <input
              id="community-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              onClick={handleImageClick}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Upload New Image
            </Button>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-body-semibold text-light-1">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-small-semibold text-light-2">
              Community Name
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="border-dark-4 bg-dark-3 text-light-1"
              placeholder="Enter community name"
            />
          </div>

          <div>
            <label className="mb-2 block text-small-semibold text-light-2">
              Username (c/{formData.username})
            </label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="border-dark-4 bg-dark-3 text-light-1"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="mb-2 block text-small-semibold text-light-2">
              Description
            </label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="min-h-[100px] border-dark-4 bg-dark-3 text-light-1"
              placeholder="Describe your community..."
            />
          </div>

          <div>
            <label className="mb-2 block text-small-semibold text-light-2">
              Tags (comma-separated)
            </label>
            <Input
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="border-dark-4 bg-dark-3 text-light-1"
              placeholder="technology, discussion, help"
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-body-semibold text-light-1">Privacy & Permissions</h3>
        
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
              className="size-5 rounded border-dark-4 bg-dark-3"
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
              className="size-5 rounded border-dark-4 bg-dark-3"
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
              className="size-5 rounded border-dark-4 bg-dark-3"
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
              className="size-5 rounded border-dark-4 bg-dark-3"
            />
          </div>
        </div>
      </div>

      {/* Community Rules */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-4 text-body-semibold text-light-1">Community Rules</h3>
        
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-start justify-between rounded-lg bg-dark-3 p-3">
              <div className="flex-1">
                <p className="text-small-semibold text-light-2">{index + 1}. {rule.title}</p>
                {rule.description && (
                  <p className="mt-1 text-tiny-medium text-gray-1">{rule.description}</p>
                )}
              </div>
              <Button
                onClick={() => handleRemoveRule(index)}
                className="ml-3 bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
              >
                Remove
              </Button>
            </div>
          ))}

          <div className="space-y-3 rounded-lg bg-dark-3 p-3">
            <Input
              value={newRule.title}
              onChange={(e) => setNewRule(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Rule title"
              className="border-dark-4 bg-dark-4 text-light-1"
            />
            <Textarea
              value={newRule.description}
              onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Rule description (optional)"
              className="min-h-[60px] border-dark-4 bg-dark-4 text-light-1"
            />
            <Button
              onClick={handleAddRule}
              disabled={!newRule.title.trim()}
              className="hover:bg-primary-600 w-full bg-primary-500"
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
          className="hover:bg-primary-600 bg-primary-500 px-8"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>

        {isCreator && (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 px-8 hover:bg-red-700"
          >
            Delete Community
          </Button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-dark-2 p-6">
            <h3 className="mb-4 text-heading4-medium text-light-1">Delete Community</h3>
            <p className="text-body-regular mb-4 text-gray-1">
              This action cannot be undone. All posts, members, and data will be permanently lost.
            </p>
            <p className="mb-2 text-small-semibold text-light-2">
              Type &quot;{community.name}&quit; to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mb-4 border-dark-4 bg-dark-3 text-light-1"
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