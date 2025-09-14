"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { approveJoinRequest, rejectJoinRequest } from "@/lib/actions/community.actions";

interface JoinRequest {
  _id: string;
  id: string;
  name: string;
  username: string;
  image: string;
  message: string;
  requestedAt: string;
}

interface Props {
  requests: JoinRequest[];
  currentUserId: string;
  communityId: string;
}

function CommunityJoinRequests({
  requests,
  currentUserId,
  communityId,
}: Props) {
  const router = useRouter();
  const [loadingRequest, setLoadingRequest] = useState<string | null>(null);

  const handleApproveRequest = async (requestUserId: string, userName: string) => {
    setLoadingRequest(requestUserId);
    try {
      await approveJoinRequest({
        communityId,
        requestUserId,
        adminId: currentUserId,
        path: `/communities/${communityId}`,
      });
      router.refresh();
    } catch (error) {
      console.error('Error approving request:', error);
      alert(`Failed to approve ${userName}'s request. Please try again.`);
    } finally {
      setLoadingRequest(null);
    }
  };

  const handleRejectRequest = async (requestUserId: string, userName: string) => {
    if (!confirm(`Are you sure you want to reject ${userName}'s request to join?`)) {
      return;
    }

    setLoadingRequest(requestUserId);
    try {
      await rejectJoinRequest({
        communityId,
        requestUserId,
        adminId: currentUserId,
        path: `/communities/${communityId}`,
      });
      router.refresh();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(`Failed to reject ${userName}'s request. Please try again.`);
    } finally {
      setLoadingRequest(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4">
          <Image
            src="/assets/empty-state.svg"
            alt="No requests"
            width={80}
            height={80}
            className="mx-auto opacity-50"
          />
        </div>
        <h3 className="mb-2 text-heading4-medium text-light-1">No pending requests</h3>
        <p className="text-body-regular text-gray-1">
          When users request to join your private community, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-heading4-medium text-light-1">
        Join Requests ({requests.length})
      </h2>
      
      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request._id}
            className="rounded-xl border border-dark-4 bg-dark-2 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-1 items-start gap-4">
                <Link href={`/profile/${request.id}`} className="relative flex-shrink-0">
                  <Image
                    src={request.image}
                    alt={request.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                </Link>
                
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Link href={`/profile/${request.id}`}>
                      <h3 className="text-body-semibold text-light-1 hover:underline">
                        {request.name}
                      </h3>
                    </Link>
                    <span className="text-small-regular text-gray-1">
                      @{request.username}
                    </span>
                  </div>
                  
                  <p className="mb-3 text-tiny-medium text-gray-1">
                    Requested {new Date(request.requestedAt).toLocaleDateString()} at{' '}
                    {new Date(request.requestedAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  
                  {request.message && (
                    <div className="rounded-lg bg-dark-3 p-3">
                      <p className="text-small-regular text-light-2">
                        &quot;{request.message}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="ml-4 flex items-center gap-3">
                <Button
                  onClick={() => handleRejectRequest(request.id, request.name)}
                  disabled={loadingRequest === request.id}
                  className="bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                >
                  {loadingRequest === request.id ? '...' : 'Decline'}
                </Button>
                
                <Button
                  onClick={() => handleApproveRequest(request.id, request.name)}
                  disabled={loadingRequest === request.id}
                  className="hover:bg-primary-600 bg-primary-500 px-4 py-2 text-white"
                >
                  {loadingRequest === request.id ? '...' : 'Approve'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {requests.length > 0 && (
        <div className="mt-6 rounded-lg bg-dark-3 p-4">
          <div className="flex items-start gap-3">
            <Image
              src="/assets/info.svg"
              alt="info"
              width={20}
              height={20}
              className="mt-0.5 flex-shrink-0"
            />
            <div>
              <h4 className="mb-1 text-body-semibold text-light-1">Admin Tip</h4>
              <p className="text-small-regular text-gray-1">
                Review each request carefully. Approved members will have access to all community content. 
                You can always remove members later if needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityJoinRequests;