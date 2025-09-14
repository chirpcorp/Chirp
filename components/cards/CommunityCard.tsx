import Image from "next/image";
import Link from "next/link";

import { Button } from "../ui/button";

interface Props {
  id: string;
  name: string;
  username: string;
  imgUrl: string;
  description?: string;
  isPrivate?: boolean;
  memberCount?: number;
  postCount?: number;
  tags?: string[];
  isMember?: boolean;
  userRole?: string;
  showMembers?: boolean;
  members?: {
    image: string;
  }[];
  creator?: {
    name: string;
    image: string;
  };
}

function CommunityCard({ 
  id, 
  name, 
  username, 
  imgUrl, 
  description, 
  isPrivate = false,
  memberCount = 0,
  postCount = 0,
  tags = [],
  isMember = false,
  userRole,
  showMembers = true,
  members = [],
  creator
}: Props) {
  return (
    <article className='community-card rounded-xl border border-dark-4 bg-dark-2 p-6 transition-colors hover:border-primary-500'>
      <div className='mb-4 flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <Link href={`/communities/${username || id}`} className='relative'>
            <div className='relative size-16'>
              <Image
                src={imgUrl}
                alt='community_logo'
                fill
                className='rounded-lg object-cover' // Facebook-style rounded square
              />
              {isPrivate && (
                <div className='absolute -right-1 -top-1 rounded-full bg-gray-600 p-1'>
                  <Image src='/assets/lock.svg' alt='private' width={10} height={10} />
                </div>
              )}
            </div>
          </Link>

          <div className='flex-1'>
            <Link href={`/communities/${username || id}`}>
              <h4 className='line-clamp-1 text-body-semibold text-light-1 hover:underline'>
                {name}
              </h4>
            </Link>
            <p className='text-small-regular text-gray-1'>c/{username}</p>
            
            <div className='mt-1 flex items-center gap-3'>
              <span className='text-tiny-medium text-gray-1'>
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </span>
              <span className='text-tiny-medium text-gray-1'>•</span>
              <span className='text-tiny-medium text-gray-1'>
                {postCount} post{postCount !== 1 ? 's' : ''}
              </span>
              {isPrivate && (
                <>
                  <span className='text-tiny-medium text-gray-1'>•</span>
                  <span className='text-tiny-medium text-gray-1'>Private</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Member status badge */}
        {isMember && userRole && (
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
            userRole === 'creator' ? 'bg-yellow-600 text-white' :
            userRole === 'admin' ? 'bg-red-600 text-white' :
            userRole === 'moderator' ? 'bg-blue-600 text-white' :
            'bg-green-600 text-white'
          }`}>
            {userRole}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className='mb-3 line-clamp-2 text-small-regular text-gray-1'>
          {description}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className='mb-4 flex flex-wrap gap-1'>
          {tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className='rounded bg-dark-3 px-2 py-1 text-tiny-medium text-light-2'
            >
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className='text-tiny-medium text-gray-1'>+{tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className='flex items-center justify-between'>
        <Link href={`/communities/${username || id}`}>
          <Button 
            size='sm' 
            className={`${isMember ? 'hover:bg-primary-600 bg-primary-500' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
          >
            {isMember ? 'Open' : isPrivate ? 'Request' : 'Join'}
          </Button>
        </Link>

        {/* Member avatars */}
        {showMembers && members.length > 0 && (
          <div className='flex items-center'>
            <div className='flex'>
              {members.slice(0, 3).map((member, index) => (
                <Image
                  key={index}
                  src={member.image}
                  alt={`member_${index}`}
                  width={24}
                  height={24}
                  className={`${
                    index !== 0 && "-ml-2"
                  } rounded-full border-2 border-dark-2 object-cover`}
                />
              ))}
            </div>
            {memberCount > 3 && (
              <span className='ml-2 text-tiny-medium text-gray-1'>
                +{memberCount - 3}
              </span>
            )}
          </div>
        )}

        {/* Creator info for private communities */}
        {isPrivate && creator && (
          <div className='flex items-center gap-2'>
            <Image
              src={creator.image}
              alt={creator.name}
              width={20}
              height={20}
              className='rounded-full'
            />
            <span className='text-tiny-medium text-gray-1'>
              by {creator.name}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export default CommunityCard;
