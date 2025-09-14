"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { removeMember, promoteToAdmin } from "@/lib/actions/community.actions";

interface Member {
  _id: string;
  id: string;
  name: string;
  username: string;
  image: string;
  role: string;
  joinedAt: string;
}

interface Props {
  members: Member[];
  currentUserId: string;
  communityId: string;
  isAdmin: boolean;
  isCreator: boolean;
  currentUserRole?: string;
}

function CommunityMembersList({
  members,
  currentUserId,
  communityId,
  isAdmin,
  isCreator,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const [loadingMember, setLoadingMember] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the community?`)) {
      return;
    }

    setLoadingMember(memberId);
    try {
      await removeMember({
        communityId,
        memberId,
        adminId: currentUserId,
        path: `/communities/${communityId}`,
      });
      router.refresh();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    } finally {
      setLoadingMember(null);
    }
  };

  const handlePromoteToAdmin = async (memberId: string, memberName: string) => {
    if (!confirm(`Promote ${memberName} to admin? They will have the same permissions as you.`)) {
      return;
    }

    setLoadingMember(memberId);
    try {
      await promoteToAdmin({
        communityId,
        memberId,
        creatorId: currentUserId,
        path: `/communities/${communityId}`,
      });
      router.refresh();
    } catch (error) {
      console.error('Error promoting member:', error);
      alert('Failed to promote member. Please try again.');
    } finally {
      setLoadingMember(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      creator: 'bg-yellow-600 text-white',
      admin: 'bg-red-600 text-white',
      moderator: 'bg-blue-600 text-white',
      member: 'bg-gray-600 text-white',
    };

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${roleColors[role as keyof typeof roleColors] || roleColors.member}`}>
        {role}
      </span>
    );
  };

  const canManageMember = (member: Member) => {
    if (member.id === currentUserId) return false; // Can't manage yourself
    if (member.role === 'creator') return false; // Can't manage creator
    if (member.role === 'admin' && currentUserRole !== 'creator') return false; // Only creator can manage admins
    return isAdmin || isCreator;
  };

  const canPromoteToAdmin = (member: Member) => {
    return isCreator && member.role === 'member' && member.id !== currentUserId;
  };

  if (members.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-body-regular text-gray-1">No members found.</p>
      </div>
    );
  }

  // Sort members by role: creator, admin, moderator, member
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { creator: 0, admin: 1, moderator: 2, member: 3 };
    return (roleOrder[a.role as keyof typeof roleOrder] || 3) - (roleOrder[b.role as keyof typeof roleOrder] || 3);
  });

  return (
    <div className="space-y-4">
      <h2 className="text-heading4-medium text-light-1">
        Members ({members.length})
      </h2>
      
      <div className="space-y-3">
        {sortedMembers.map((member) => (
          <div
            key={member._id}
            className="flex items-center justify-between rounded-xl bg-dark-2 p-4"
          >
            <div className="flex items-center gap-4">
              <Link href={`/profile/${member.id}`} className="relative">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              </Link>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${member.id}`}>
                    <h3 className="text-body-semibold text-light-1 hover:underline">
                      {member.name}
                    </h3>
                  </Link>
                  {getRoleBadge(member.role)}
                </div>
                <p className="text-small-regular text-gray-1">@{member.username}</p>
                <p className="text-tiny-medium text-gray-1">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Admin Actions */}
            {canManageMember(member) && (
              <div className="flex items-center gap-2">
                {canPromoteToAdmin(member) && (
                  <Button
                    onClick={() => handlePromoteToAdmin(member.id, member.name)}
                    disabled={loadingMember === member.id}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs text-white"
                  >
                    {loadingMember === member.id ? '...' : 'Promote'}\n                  </Button>
                )}
                
                <Button
                  onClick={() => handleRemoveMember(member.id, member.name)}
                  disabled={loadingMember === member.id}
                  className="bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                >
                  {loadingMember === member.id ? '...' : 'Remove'}
                </Button>
              </div>
            )}

            {/* Show "You" indicator */}
            {member.id === currentUserId && (
              <span className="text-small-regular font-semibold text-primary-500">
                You
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommunityMembersList;