"use client";
import { useState } from "react";
import Link from "next/link";

type NavLink = { href: string; label: string; accent?: boolean; danger?: boolean };

export default function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(p => !p)} aria-label="Menu"
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <div className="w-5 flex flex-col gap-1">
          <span className={`block h-0.5 bg-gray-600 transition-all duration-200 ${open ? "rotate-45 translate-y-1.5" : ""}`} />
          <span className={`block h-0.5 bg-gray-600 transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 bg-gray-600 transition-all duration-200 ${open ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
          <nav className="fixed top-14 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 p-4 grid grid-cols-3 gap-2 max-h-[80vh] overflow-y-auto">
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className={`flex items-center justify-center py-3 px-2 rounded-xl text-sm font-medium text-center transition-colors ${
                  l.danger ? "bg-red-50 text-red-600" :
                  l.accent ? "bg-green-50 text-green-700" :
                  "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
                }`}>
                {l.label}
              </Link>
            ))}
            <Link href="/settings" onClick={() => setOpen(false)}
              className="flex items-center justify-center py-3 px-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
              Settings
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
