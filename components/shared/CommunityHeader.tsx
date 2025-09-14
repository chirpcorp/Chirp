"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatDateString } from "@/lib/utils";
import { joinCommunity, leaveCommunity, inviteToJoinCommunity } from "@/lib/actions/community.actions";

interface Props {
  communityId: string;
  currentUserId: string;
  name: string;
  username: string;
  description?: string;
  image: string;
  coverImage?: string;
  isPrivate: boolean;
  memberCount: number;
  postCount: number;
  tags?: string[];
  rules?: { title: string; description: string }[];
  createdAt: string;
  creator: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
  currentUserRole?: string;
  isMember: boolean;
  isAdmin: boolean;
  isCreator: boolean;
}

function CommunityHeader({
  communityId,
  currentUserId,
  name,
  username,
  description,
  image,
  coverImage,
  isPrivate,
  memberCount,
  postCount,
  tags = [],
  rules = [],
  createdAt,
  creator,
  currentUserRole,
  isMember,
  isAdmin,
  isCreator,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleJoinLeave = async () => {
    setIsLoading(true);
    try {
      if (isMember) {
        await leaveCommunity({
          communityId,
          userId: currentUserId,
          path: `/communities/${communityId}`,
        });
        router.refresh();
      } else {
        const result = await joinCommunity({
          communityId,
          userId: currentUserId,
          path: `/communities/${communityId}`,
        });
        
        if (result.status === 'request_sent') {
          // Show success message for private community request
          alert('Join request sent! You will be notified when an admin reviews your request.');
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Error joining/leaving community:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col rounded-xl bg-dark-2 p-0 overflow-hidden">
      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-48 w-full">
          <Image
            src={coverImage}
            alt={`${name} cover`}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        {/* Community Profile Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="relative h-20 w-20">
                <Image
                  src={image}
                  alt={name}
                  fill
                  className="rounded-xl object-cover" // Facebook-style rounded square
                />
              </div>
              {isPrivate && (
                <div className="absolute -top-2 -right-2 bg-gray-600 rounded-full p-2">
                  <Image src='/assets/lock.svg' alt='private' width={12} height={12} />
                </div>
              )}
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-heading3-bold text-light-1">{name}</h1>
              <p className="text-body-regular text-gray-1">c/{username}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-small-regular text-gray-1">
                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                </span>
                <span className="text-small-regular text-gray-1">
                  {postCount} post{postCount !== 1 ? 's' : ''}
                </span>
                {isPrivate && (
                  <span className="text-small-regular text-gray-1 flex items-center gap-1">
                    <Image src='/assets/lock.svg' alt='private' width={12} height={12} />
                    Private
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!isCreator && (
              <Button
                onClick={handleJoinLeave}
                disabled={isLoading}
                className={`${
                  isMember 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                } px-6`}
              >
                {isLoading ? '...' : isMember ? 'Leave' : 'Join'}
              </Button>
            )}
            
            {(isAdmin || isCreator) && (
              <Button
                onClick={() => setShowInviteModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                Invite
              </Button>
            )}
            
            {(isAdmin || isCreator) && (
              <Link href={`/communities/${communityId}/edit`}>
                <Button className="bg-gray-600 hover:bg-gray-700 text-white px-4">
                  <Image src='/assets/edit.svg' alt='edit' width={16} height={16} />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="mt-4">
            <p className="text-body-regular text-light-2">{description}</p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="bg-dark-3 text-light-2 px-3 py-1 rounded-full text-small-regular"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Community Info */}
        <div className="mt-6 flex items-center justify-between text-small-regular text-gray-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src={creator.image}
                alt={creator.name}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span>Created by {creator.name}</span>
            </div>
            <span>•</span>
            <span>{formatDateString(createdAt)}</span>
          </div>
          
          {currentUserRole && (
            <div className="flex items-center gap-2">
              <span className="text-primary-500 font-semibold capitalize">
                {currentUserRole}
              </span>
            </div>
          )}
        </div>

        {/* Community Rules Preview */}
        {rules.length > 0 && (
          <div className="mt-4 p-4 bg-dark-3 rounded-lg">
            <h4 className="text-body-semibold text-light-1 mb-2">Community Rules</h4>
            <div className="space-y-2">
              {rules.slice(0, 3).map((rule, index) => (
                <div key={index} className="text-small-regular text-light-2">
                  <span className="font-semibold">{index + 1}. {rule.title}</span>
                  {rule.description && (
                    <p className="text-gray-1 mt-1">{rule.description}</p>
                  )}
                </div>
              ))}
              {rules.length > 3 && (
                <p className="text-small-regular text-gray-1">
                  +{rules.length - 3} more rule{rules.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal Placeholder - will implement later */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-2 p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-heading4-medium text-light-1 mb-4">Invite Members</h3>
            <p className="text-body-regular text-gray-1 mb-4">
              Share the community link or search for users to invite.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowInviteModal(false)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button className="bg-primary-500 hover:bg-primary-600">
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityHeader;