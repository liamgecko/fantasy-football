import Link from "next/link"

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight">Fantasy App v2</h1>
        <p className="text-muted-foreground text-base">
          A playground for building a lightning-fast NFL fantasy dashboard on top of the ESPN data APIs. Use the
          links below to explore the live data feeds currently wired into the backend.
        </p>
      </header>
      <section>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/athletes"
            className="group rounded-lg border border-border bg-background p-6 transition hover:border-primary hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold group-hover:text-primary">NFL Players</h2>
            <p className="text-sm text-muted-foreground">
              Fetches the complete active player catalogue from ESPN and renders it with server-side caching.
            </p>
          </Link>
          <Link
            href="/api/teams"
            className="group rounded-lg border border-border bg-background p-6 transition hover:border-primary hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold group-hover:text-primary">Teams API</h2>
            <p className="text-sm text-muted-foreground">
              Inspect the JSON response served by our Next.js API route for NFL teams.
            </p>
          </Link>
        </div>
      </section>
      <footer className="mt-auto border-t border-border pt-6 text-sm text-muted-foreground">
        Data sourced from publicly accessible ESPN endpoints. Responses are cached with smart revalidation so the
        UI stays responsive while staying up to date.
      </footer>
    </div>
  )
}
