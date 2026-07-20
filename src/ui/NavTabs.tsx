"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavTabsProps {
  tabs: Array<{ href: string; label: string }>;
}

// Phone-first: a fixed bar at the bottom thumb zone; inline under the header
// on larger screens. Only logical/flow-relative styling — RTL flips for free.
export function NavTabs({ tabs }: NavTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white/95 backdrop-blur sm:static sm:border-t-0 sm:border-b sm:bg-transparent">
      <ul className="mx-auto grid w-full max-w-3xl grid-cols-4">
        {tabs.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`block px-2 py-3 text-center text-sm ${
                  active ? "font-semibold" : "opacity-60"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
