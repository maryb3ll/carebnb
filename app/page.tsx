import Link from "next/link";

/**
 * Landing page at localhost:3000/ — hero, value prop, and clear CTAs.
 */
export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-var(--content-pt))] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            <span className="home-title-gradient">
              <span className="inline-block opacity-0 animate-home-title-line">Care when and where </span>
              <span className="inline-block opacity-0 animate-home-title-line animate-home-delay-05">you need it</span>
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-stone-600 mb-10 max-w-xl mx-auto leading-relaxed opacity-0 animate-home-fade-in-up animate-home-delay-1">
            Book trusted in-home care providers or post a care request. For patients and families — simple, local, and reliable.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center opacity-0 animate-home-fade-in-up animate-home-delay-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center py-3.5 px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 hover:opacity-95 transition-opacity"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center py-3.5 px-8 rounded-xl border-2 border-stone-300 text-stone-700 font-semibold text-base hover:bg-stone-50 hover:border-stone-400 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Two-column: Patients / Providers */}
      <section className="py-12 sm:py-16 border-t border-stone-200 bg-stone-100/50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-semibold text-stone-800 text-center mb-8 opacity-0 animate-home-fade-in animate-home-delay-1">
            How you use CareBnB
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {/* Patients */}
            <div className="rounded-2xl bg-white border border-stone-200 shadow-sm p-6 sm:p-8 flex flex-col opacity-0 animate-home-fade-in-up animate-home-delay-2 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary font-semibold text-lg">
                You
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                I need care
              </h3>
              <p className="text-stone-600 text-sm mb-6 flex-1">
                Search for local providers, book visits, and request care for yourself or a loved one — all from home.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/signup"
                  className="block w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-center text-sm hover:opacity-90 transition-opacity"
                >
                  Patient sign up
                </Link>
                <Link
                  href="/login"
                  className="block w-full py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 font-medium text-center text-sm hover:bg-stone-50 transition-colors"
                >
                  Patient log in
                </Link>
              </div>
            </div>

            {/* Providers */}
            <div className="rounded-2xl bg-white border border-stone-200 shadow-sm p-6 sm:p-8 flex flex-col opacity-0 animate-home-fade-in-up animate-home-delay-3 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-stone-200 flex items-center justify-center mb-4 text-stone-600 font-semibold text-lg">
                RN
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                I provide care
              </h3>
              <p className="text-stone-600 text-sm mb-6 flex-1">
                See open care requests, manage your schedule, and connect with patients in your area.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/signup?role=provider"
                  className="block w-full py-2.5 px-4 rounded-xl border-2 border-stone-300 text-stone-800 font-medium text-center text-sm hover:bg-stone-50 transition-colors"
                >
                  Provider sign up
                </Link>
                <Link
                  href="/login/provider"
                  className="block w-full py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 font-medium text-center text-sm hover:bg-stone-50 transition-colors"
                >
                  Provider log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer line */}
      <footer className="py-6 text-center text-sm text-stone-500 border-t border-stone-100 opacity-0 animate-home-fade-in animate-home-delay-4">
        CareBnB — find and book local care, or offer your services.
      </footer>
    </div>
  );
}
