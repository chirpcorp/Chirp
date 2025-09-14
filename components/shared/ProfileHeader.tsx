import Link from "next/link";
import Image from "next/image";
import ProfileActions from "@/components/shared/ProfileActions";

interface Props {
  accountId: string;
  authUserId: string;
  name: string;
  username: string;
  imgUrl: string;
  bio: string;
  email?: string;
  website?: string;
  location?: string;
  joinedDate?: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
  isPrivate?: boolean;
  hasPendingRequest?: boolean;
  type?: string;
}

function ProfileHeader({
  accountId,
  authUserId,
  name,
  username,
  imgUrl,
  bio,
  email,
  website,
  location,
  joinedDate,
  followersCount = 0,
  followingCount = 0,
  isFollowing = false,
  isBlocked = false,
  isPrivate = false,
  hasPendingRequest = false,
  type,
}: Props) {
  // Add safety checks to prevent infinite recursion
  if (!accountId || !authUserId || !name || !username || !imgUrl) {
    return null;
  }

  const isOwnProfile = accountId === authUserId;

  return (
    <div className='flex w-full flex-col justify-start'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-4'>
          <div className='relative h-24 w-24 object-cover'>
            <Image
              src={imgUrl}
              alt='profile image'
              fill
              className='rounded-full object-cover shadow-2xl'
            />
          </div>

          <div className='flex-1'>
            <h2 className='text-left text-heading3-bold text-light-1 flex items-center gap-2'>
              {name}
              {isPrivate && (
                <Image
                  src='/assets/lock.svg'
                  alt='private account'
                  width={16}
                  height={16}
                  className='text-gray-1'
                />
              )}
            </h2>
            <p className='text-base-medium text-gray-1 flex items-center gap-1'>
              @{username}
              {isPrivate && (
                <Image
                  src='/assets/lock.svg'
                  alt='private account'
                  width={12}
                  height={12}
                  className='text-gray-1 opacity-70'
                />
              )}
            </p>
            
            {/* Stats */}
            <div className='flex gap-4 mt-2'>
              <Link href={`/profile/${accountId}/following`} className='text-small-medium text-gray-1 hover:text-light-1 transition-colors cursor-pointer'>
                <span className='text-light-1 font-semibold'>{followingCount}</span> Following
              </Link>
              <Link href={`/profile/${accountId}/followers`} className='text-small-medium text-gray-1 hover:text-light-1 transition-colors cursor-pointer'>
                <span className='text-light-1 font-semibold'>{followersCount}</span> Followers
              </Link>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className='flex gap-2'>
          {isOwnProfile && type !== "Community" ? (
            <Link href='/profile/edit'>
              <div className='flex cursor-pointer gap-2 rounded-lg bg-dark-3 px-4 py-2 hover:bg-dark-4 transition-colors'>
                <Image
                  src='/assets/edit.svg'
                  alt='edit'
                  width={16}
                  height={16}
                />
                <p className='text-light-2 max-sm:hidden'>Edit Profile</p>
              </div>
            </Link>
          ) : (
            accountId && authUserId && (
              <ProfileActions
                currentUserId={authUserId}
                targetUserId={accountId}
                targetUsername={username}
                isFollowing={isFollowing}
                isBlocked={isBlocked}
                hasPendingRequest={hasPendingRequest}
                isPrivate={isPrivate}
              />
            )
          )}
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className='mt-4 max-w-lg text-base-regular text-light-2'>{bio}</p>
      )}

      {/* Additional info */}
      <div className='mt-3 flex flex-wrap gap-4 text-small-medium text-gray-1'>
        {location && (
          <div className='flex items-center gap-1'>
            <Image src='/assets/location.svg' alt='location' width={16} height={16} />
            {location}
          </div>
        )}
        {website && (
          <div className='flex items-center gap-1'>
            <Image src='/assets/link.svg' alt='website' width={16} height={16} />
            <a href={website} target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:underline'>
              {website.replace(/(https?:\/\/)?(www\.)?/, '')}
            </a>
          </div>
        )}
        {email && (
          <div className='flex items-center gap-1'>
            <Image src='/assets/email.svg' alt='email' width={16} height={16} />
            <a href={`mailto:${email}`} className='text-blue-400 hover:underline'>
              {email}
            </a>
          </div>
        )}
        {joinedDate && (
          <div className='flex items-center gap-1'>
            <Image src='/assets/calendar.svg' alt='joined' width={16} height={16} />
            Joined {new Date(joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      <div className='mt-6 h-0.5 w-full bg-dark-3' />
    </div>
  );
}

export default ProfileHeader;