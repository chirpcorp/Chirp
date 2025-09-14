"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarLinks } from "@/constants";

function Bottombar() {
  const pathname = usePathname() || "";

  return (
    <nav className="bottombar">
      <div className="bottombar_container">
        {sidebarLinks.map((link) => {
          const isActive =
            (pathname.includes(link.route) && link.route.length > 1) ||
            pathname === link.route;

          return (
            <Link
              href={link.route}
              key={link.label}
              className={`bottombar_link ${isActive ? "bg-primary-500" : ""}`}
            >
              <div className="relative h-5 w-5">
                <Image
                  src={link.imgURL}
                  alt={link.label}
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default Bottombar;
