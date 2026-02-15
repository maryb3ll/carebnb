import Link from "next/link";

/**
 * Simple landing page at localhost:3000/ — explains the site and links to the app.
 */
export default function HomePage() {
  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold text-stone-900 mb-2">
        CareBnB
      </h1>
      <p className="text-stone-600 mb-6">
        Find and book local care providers, or post a care request for providers to respond to.
      </p>

      <div className="space-y-3 mb-8">
        <p className="text-sm text-stone-700">
          <strong>Patients</strong> — Search for providers, book visits, and request care.
        </p>
        <p className="text-sm text-stone-700">
          <strong>Providers</strong> — See open requests and manage your jobs.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/login"
          className="block w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-center hover:opacity-90"
        >
          Patient log in
        </Link>
        <Link
          href="/signup"
          className="block w-full py-3 px-4 rounded-xl border-2 border-primary text-primary font-medium text-center hover:bg-primary/5"
        >
          Patient sign up
        </Link>
        <Link
          href="/login?role=provider"
          className="block w-full py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-medium text-center hover:bg-stone-50"
        >
          Provider log in
        </Link>
        <Link
          href="/signup?role=provider"
          className="block w-full py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-medium text-center hover:bg-stone-50"
        >
          Provider sign up
        </Link>
      </div>
    </div>
  );
}
