"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavProviderLink() {
  const pathname = usePathname();
  const isProviderPage = pathname?.startsWith("/provider");

  if (isProviderPage) {
    return (
      <Link
        href="/"
        className="text-stone-900 hover:text-stone-600 text-sm font-medium"
      >
        Find care
      </Link>
    );
  }
  return (
    <Link
      href="/provider"
      className="text-stone-900 hover:text-stone-600 text-sm font-medium"
    >
      Switch to provider
    </Link>
  );
}
