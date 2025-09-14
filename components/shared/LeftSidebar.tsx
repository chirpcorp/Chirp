"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignOutButton, SignedIn, useAuth, useClerk } from "@clerk/nextjs";

import { sidebarLinks } from "@/constants";

const LeftSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { userId } = useAuth();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <section className='custom-scrollbar leftsidebar'>
      <div className='flex w-full flex-1 flex-col gap-6 px-6'>
        {sidebarLinks.map((link) => {
          // Create a route that doesn't mutate the original link object
          const linkRoute = link.route === "/profile" ? `/profile/${userId}` : link.route;
          
          const isActive = pathname &&
            ((pathname.includes(linkRoute) && linkRoute.length > 1) ||
            pathname === linkRoute);

          return (
            <Link
              href={linkRoute}
              key={link.label}
              className={`leftsidebar_link ${isActive && "bg-primary-500 "} lg:w-44`}
            >
              <Image
                src={link.imgURL}
                alt={link.label}
                width={24}
                height={24}
              />

              <p className='text-light-1 md-lg:hidden'>{link.label}</p>
            </Link>
          );
        })}
      </div>

      <div className='mt-10 px-6'>
        <SignedIn>
          <div className='flex cursor-pointer gap-4 p-4' onClick={handleSignOut}>
            <Image
              src='/assets/logout.svg'
              alt='logout'
              width={24}
              height={24}
            />

            <p className='text-light-2 max-lg:hidden'>Logout</p>
          </div>
        </SignedIn>
      </div>
    </section>
  );
};

export default LeftSidebar;
