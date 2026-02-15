"use client";

import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";

/**
 * Menu bar matching the SPA: CareBnB logo, nav links, Switch to provider, auth.
 */
export default function AppHeader() {
  return (
    <header className="app-header-bar fixed top-0 left-0 right-0 z-[100] w-full min-w-0 flex items-center bg-white border-b border-stone-100 overflow-visible">
      <div className="w-full min-w-0 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center shrink-0 min-w-0">
          <img
            src="/spa/assets/images/CareBnb_Logo__for_submission_-1771103577321.png"
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
          <Link
            href="/provider-dashboard-and-management"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#FF385C] shrink-0">
              <path d="M11 2v4M18 6v4M4 12h16M11 18v-4M18 14v-4" />
            </svg>
            Switch to provider
          </Link>
          <div className="inline-flex items-center pl-3 ml-3 border-l border-stone-100">
            <HeaderAuth />
          </div>
        </nav>
      </div>
    </header>
  );
}
