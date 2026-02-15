"use client";

import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";

/**
 * Menu bar: CareBnB logo, patient nav links, auth. No role-switch links.
 */
export default function AppHeader() {
  return (
    <header className="app-header-bar fixed top-0 left-0 right-0 z-[100] w-full min-w-0 flex items-center bg-white border-b border-stone-100 overflow-visible">
      <div className="w-full min-w-0 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center shrink-0 min-w-0">
          <img
            src="/assets/images/CareBnb_Logo__for_submission_-1771103577321.png"
            alt="CareBnB Logo"
            className="app-header-logo object-contain object-left"
          />
        </Link>

        <nav className="flex items-center gap-2 shrink-0">
          <Link
            href="/bookings"
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            My bookings
          </Link>
          <Link
            href="/request-care"
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            Request care
          </Link>
          <div className="inline-flex items-center pl-3 ml-3 border-l border-stone-100">
            <HeaderAuth />
          </div>
        </nav>
      </div>
    </header>
  );
}
