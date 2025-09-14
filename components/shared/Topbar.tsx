import { OrganizationSwitcher, SignedIn, SignOutButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

function Topbar() {
  return (
    <nav className='topbar'>
      <Link href='/' className='flex items-center gap-4'>
        <Image src='/logo.svg' alt='logo' width={28} height={28} />
        <p className='text-heading3-bold text-light-1 max-xs:hidden'>Chirp</p>
      </Link>

      <div className='flex items-center gap-1'>
        <div className='block md:hidden'>
          <SignedIn>
            <SignOutButton>
              <div className='flex cursor-pointer'>
                <Image
                  src='/assets/logout.svg'
                  alt='logout'
                  width={24}
                  height={24}
                />
              </div>
            </SignOutButton>
          </SignedIn>
        </div>

        {/* Conditionally render OrganizationSwitcher only if organizations are enabled */}
        {process.env.NODE_ENV === 'production' ? (
          <OrganizationSwitcher
            appearance={{
              elements: {
                organizationSwitcherTrigger: "py-2 px-4",
              },
            }}
          />
        ) : (
          <div className='py-2 px-4 text-light-2 text-sm'>
            {/* Placeholder for the version name in development */}
            <strong>Beta Version</strong>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Topbar;
