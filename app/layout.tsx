import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "CareBnb — Find care near you",
  description: "Book local care providers or find open care requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen w-full min-w-0 antialiased bg-stone-50 text-stone-900">
        <AppHeader />
        <main className="w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
