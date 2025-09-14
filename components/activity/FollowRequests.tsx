"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { getFollowRequests, acceptFollowRequest, rejectFollowRequest } from "@/lib/actions/user.actions";

interface FollowRequest {
  _id: string;
  user: {
    _id: string;
    id: string;
    name: string;
    username: string;
    image: string;
  };
  requestedAt: string;
}

function FollowRequests() {
  const { user } = useUser();
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      if (!user) return;
      const followRequests = await getFollowRequests(user.id);
      setRequests(followRequests);
    } catch (error) {
      console.error("Error fetching follow requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string, requesterUserId: string) => {
    setActionLoading(prev => {
      const newSet = new Set(prev);
      newSet.add(requestId);
      return newSet;
    });
    try {
      await acceptFollowRequest(user!.id, requesterUserId, '/activity');
      setRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error("Error accepting follow request:", error);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string, requesterUserId: string) => {
    setActionLoading(prev => {
      const newSet = new Set(prev);
      newSet.add(requestId);
      return newSet;
    });
    try {
      await rejectFollowRequest(user!.id, requesterUserId, '/activity');
      setRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error("Error rejecting follow request:", error);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Image
          src="/assets/empty.svg"
          alt="No requests"
          width={64}
          height={64}
          className="mx-auto mb-4 opacity-50"
        />
        <h3 className="text-heading4-medium text-light-1 mb-2">No follow requests</h3>
        <p className="text-base-regular text-gray-1">
          When someone requests to follow your private account, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-heading4-medium text-light-1 mb-4">
        Follow Requests ({requests.length})
      </h3>
      
      {requests.map((request) => (
        <div key={request._id} className="flex items-center justify-between p-4 bg-dark-2 rounded-lg">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${request.user.id}`}>
              <Image
                src={request.user.image}
                alt={request.user.name}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            </Link>
            <div>
              <Link href={`/profile/${request.user.id}`}>
                <h4 className="text-body-semibold text-light-1 hover:text-primary-500 transition-colors">
                  {request.user.name}
                </h4>
              </Link>
              <p className="text-small-regular text-gray-1">@{request.user.username}</p>
              <p className="text-subtle-medium text-gray-1">
                {new Date(request.requestedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleReject(request._id, request.user.id)}
              disabled={actionLoading.has(request._id)}
              className="px-4 py-2 text-sm bg-dark-3 text-light-2 rounded-lg hover:bg-dark-4 transition-colors disabled:opacity-50"
            >
              {actionLoading.has(request._id) ? (
                <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Decline'
              )}
            </button>
            <button
              onClick={() => handleAccept(request._id, request.user.id)}
              disabled={actionLoading.has(request._id)}
              className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {actionLoading.has(request._id) ? (
                <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Accept'
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FollowRequests;