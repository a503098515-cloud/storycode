// The home page. Lists the available levels and the signed-in user's submissions.
// Server Component — queries the database and renders server-side; redirects
// to /login when there's no session.
import { currentUserId } from "@project/auth";
import { getUser, listLevels, listSubmissions } from "@project/domain";
import { SignOutButton } from "@/components/SignOutButton";
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
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">StoryCode</h1>
          <p className="text-sm text-neutral-500">
            {submissions.length} submission{submissions.length === 1 ? "" : "s"} · signed in as{" "}
            <code className="rounded bg-neutral-100 px-1">{user.email}</code>
          </p>
        </div>
        <SignOutButton />
      </header>

      {levels.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-500">
          No levels are available yet. Add starter levels with <code className="rounded bg-neutral-100 px-1">pnpm db:seed</code>.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {levels.map((level) => (
            <li key={level.id} className="space-y-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Level {level.order}</p>
              <h2 className="font-medium">{level.title}</h2>
              <p className="text-sm text-neutral-600">{level.storyText}</p>
              <p className="text-sm text-neutral-500">{level.codingChallenge}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
