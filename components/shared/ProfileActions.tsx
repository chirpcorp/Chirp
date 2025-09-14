"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import { followUser, blockUser, reportUser } from "@/lib/actions/user.actions";

interface Props {
  currentUserId: string;
  targetUserId: string;
  targetUsername: string;
  isFollowing: boolean;
  isBlocked: boolean;
  hasPendingRequest?: boolean;
  isPrivate?: boolean;
}

function ProfileActions({
  currentUserId,
  targetUserId,
  targetUsername,
  isFollowing: initialIsFollowing,
  isBlocked: initialIsBlocked,
  hasPendingRequest = false,
  isPrivate = false,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
  const [pendingRequest, setPendingRequest] = useState(hasPendingRequest);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with props to handle updates from parent
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
    setIsBlocked(initialIsBlocked);
    setPendingRequest(hasPendingRequest);
  }, [initialIsFollowing, initialIsBlocked, hasPendingRequest]);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const result = await followUser(currentUserId, targetUserId, pathname);
      
      if (result.status === 'following') {
        setIsFollowing(true);
        setPendingRequest(false);
      } else if (result.status === 'unfollowed') {
        setIsFollowing(false);
        setPendingRequest(false);
      } else if (result.status === 'request_sent') {
        setIsFollowing(false);
        setPendingRequest(true);
      } else if (result.status === 'request_cancelled') {
        setIsFollowing(false);
        setPendingRequest(false);
      }
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = async () => {
    setIsLoading(true);
    try {
      const newBlockStatus = await blockUser(currentUserId, targetUserId, pathname);
      setIsBlocked(newBlockStatus);
      if (newBlockStatus) {
        setIsFollowing(false); // If blocked, can't be following
      }
      setShowMenu(false);
    } catch (error) {
      console.error("Error blocking user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    
    setIsLoading(true);
    try {
      await reportUser(currentUserId, targetUserId, reportReason, pathname);
      setShowReportModal(false);
      setReportReason("");
      setShowMenu(false);
      // Show success message (you can implement a toast system)
      alert("User reported successfully");
    } catch (error) {
      console.error("Error reporting user:", error);
      alert("Failed to report user");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a safety check to prevent infinite recursion
  if (!currentUserId || !targetUserId) {
    return null;
  }

  if (isBlocked) {
    return (
      <div className='flex gap-2'>
        <button
          onClick={handleBlock}
          disabled={isLoading}
          className='flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors disabled:opacity-50'
        >
          <Image src='/assets/unblock.svg' alt='unblock' width={16} height={16} />
          Unblock
        </button>
      </div>
    );
  }

  return (
    <>
      <div className='flex gap-2 relative'>
        {/* Follow/Unfollow Button */}
        <button
          onClick={handleFollow}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
            isFollowing
              ? 'bg-gray-600 text-white hover:bg-gray-700'
              : pendingRequest
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Image 
            src={
              isFollowing 
                ? '/assets/unfollow.svg' 
                : pendingRequest 
                ? '/assets/pending.svg'
                : '/assets/follow.svg'
            } 
            alt={
              isFollowing 
                ? 'unfollow' 
                : pendingRequest 
                ? 'pending request'
                : 'follow'
            } 
            width={16} 
            height={16} 
          />
          {isFollowing 
            ? 'Unfollow' 
            : pendingRequest 
            ? 'Requested'
            : 'Follow'
          }
        </button>

        {/* More Options Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className='flex items-center justify-center rounded-lg bg-dark-3 p-2 hover:bg-dark-4 transition-colors'
        >
          <Image src='/assets/more.svg' alt='more options' width={16} height={16} />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className='absolute right-0 top-12 z-10 w-48 rounded-lg bg-dark-2 border border-dark-3 shadow-lg'>
            <button
              onClick={() => {
                setShowReportModal(true);
                setShowMenu(false);
              }}
              className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-light-2 hover:bg-dark-3 transition-colors'
            >
              <Image src='/assets/report.svg' alt='report' width={16} height={16} />
              Report @{targetUsername}
            </button>
            <button
              onClick={handleBlock}
              disabled={isLoading}
              className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-3 transition-colors disabled:opacity-50'
            >
              <Image src='/assets/block.svg' alt='block' width={16} height={16} />
              Block @{targetUsername}
            </button>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='w-full max-w-md rounded-lg bg-dark-2 p-6'>
            <h3 className='text-lg font-semibold text-light-1 mb-4'>
              Report @{targetUsername}
            </h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder='Please explain why you are reporting this user...'
              className='w-full h-32 p-3 rounded-lg bg-dark-3 text-light-1 border border-dark-4 focus:border-primary-500 focus:outline-none resize-none'
            />
            <div className='flex gap-3 mt-4'>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason("");
                }}
                className='flex-1 rounded-lg bg-dark-3 py-2 text-sm text-light-2 hover:bg-dark-4 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={isLoading || !reportReason.trim()}
                className='flex-1 rounded-lg bg-red-600 py-2 text-sm text-white hover:bg-red-700 transition-colors disabled:opacity-50'
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className='fixed inset-0 z-5' 
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
}

export default ProfileActions;