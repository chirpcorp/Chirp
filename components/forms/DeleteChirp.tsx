"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { deleteChirp } from "@/lib/actions/chirp.actions";

interface Props {
  chirpId: string;
  currentUserId: string;
  authorId: string;
  parentId: string | null;
  isComment?: boolean;
}

function DeleteChirp({
  chirpId,
  currentUserId,
  authorId,
  parentId,
  isComment,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  // Fix the condition - it should show for the author or in non-home pages
  if (currentUserId !== authorId) return null;

  return (
    <Image
      src='/assets/delete.svg'
      alt='delete'
      width={18}
      height={18}
      className='cursor-pointer object-contain'
      onClick={async () => {
        await deleteChirp(JSON.parse(chirpId), pathname);
        if (!parentId || !isComment) {
          router.refresh(); // Refresh the page instead of redirecting to home
        }
      }}
    />
  );
}

export default DeleteChirp;