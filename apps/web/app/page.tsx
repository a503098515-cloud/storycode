// The home page. Lists the available levels and the signed-in user's submissions.
// Server Component — queries the database and renders server-side; redirects
// to /login when there's no session.
import { currentUserId } from "@project/auth";
import { getUser, listLevels, listSubmissions } from "@project/domain";
import { SignOutButton } from "@/components/SignOutButton";
import Link from "next/link";
import { ProgressForm } from "@/components/ProgressForm";
import { LevelList } from "@/components/LevelList";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const user = await getUser(userId);
  if (!user) redirect("/login"); // stale cookie (e.g. after db:reset)

  const [levels, submissions] = await Promise.all([listLevels(), listSubmissions(userId)]);

  return (
    <main className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <Link href="/" className="text-xl font-bold tracking-tight text-neutral-900">
          Story<span className="text-indigo-600">Code</span>
        </Link>
        <nav aria-label="Account" className="flex items-center gap-3">
          <span className="hidden text-sm text-neutral-500 sm:inline">{user.email}</span>
          <Link
            href="/profile"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Profile
          </Link>
          <SignOutButton />
        </nav>
      </header>

      <section className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Your learning path</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Keep learning, one step at a time.
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Follow the story, work through each challenge, and submit your solution.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              {levels.length} level{levels.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-600">
              {submissions.length} submission{submissions.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      {levels.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
          No levels are available yet. Add starter levels with{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">pnpm db:seed</code>.
        </p>
      ) : (
        <>
          <ProgressForm levels={levels} currentLevelId={user.currentLevelId} />
          <LevelList />
        </>
      )}
    </main>
  );
}