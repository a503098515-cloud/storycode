"use client";

import { useEffect, useState } from "react";
import { SubmissionForm } from "@/components/SubmissionForm";


type Level = {
  id: string;
  title: string;
  storyText: string;
  codingChallenge: string;
  order: number;
};

type Status = "loading" | "ready" | "signedOut" | "error";

export function LevelList() {
  const [status, setStatus] = useState<Status>("loading");
  const [levels, setLevels] = useState<Level[]>([]);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0); // bump to refetch

  useEffect(() => {
    let cancelled = false; // ignore a late response if the component unmounted

    async function load() {
      try {
        const res = await fetch("/api/levels");
        if (res.status === 401) {
          if (!cancelled) setStatus("signedOut");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setMessage(data?.error?.message ?? "Something went wrong");
          setStatus("error");
          return;
        }
        setLevels(data.levels);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setMessage("Couldn't reach the server. Check your connection and try again.");
        setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function reload() {
    setStatus("loading");
    setAttempt((a) => a + 1);
  }

  if (status === "loading") {
    return (
      <section aria-labelledby="levels-heading" aria-busy="true" className="space-y-4">
        <div>
          <h2 id="levels-heading" className="text-lg font-semibold text-neutral-900">Your challenges</h2>
          <p className="mt-1 text-sm text-neutral-500">Loading your learning path…</p>
        </div>
        <ul className="space-y-3">
          {[0, 1].map((i) => (
            <li key={i} className="animate-pulse rounded-xl border border-neutral-200 bg-white p-5">
              <div className="h-3 w-16 rounded bg-neutral-200" />
              <div className="mt-3 h-5 w-48 rounded bg-neutral-200" />
              <div className="mt-4 h-3 w-full rounded bg-neutral-100" />
              <div className="mt-2 h-3 w-3/4 rounded bg-neutral-100" />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (status === "signedOut") {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
        <p className="text-neutral-600">Your session ended.</p>
        <a href="/login" className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Sign in again
        </a>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-800">We couldn’t load your challenges</p>
        <p className="mt-1 text-sm text-red-700">{message}</p>
        <button onClick={reload} className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100">
          Retry
        </button>
      </div>
    );
  }

  // status === "ready". "Empty" is computed, not stored.
  if (levels.length === 0) {
    return (
      <section aria-labelledby="levels-heading" className="space-y-4">
        <div>
          <h2 id="levels-heading" className="text-lg font-semibold text-neutral-900">Your challenges</h2>
          <p className="mt-1 text-sm text-neutral-500">Pick a challenge to continue your learning path.</p>
        </div>
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="font-medium text-neutral-700">No levels are available yet.</p>
          <p className="mt-1 text-sm text-neutral-500">Check back later or reload the list.</p>
          <button onClick={reload} className="mt-4 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
          Reload
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="levels-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="levels-heading" className="text-lg font-semibold text-neutral-900">Your challenges</h2>
          <p className="mt-1 text-sm text-neutral-500">Pick a challenge to continue your learning path.</p>
        </div>
        <span className="text-sm text-neutral-500">{levels.length} available</span>
      </div>
      <ol className="space-y-4">
        {levels.map((level) => (
          <li key={level.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 sm:p-5">
            <article aria-labelledby={`level-title-${level.id}`} className="space-y-4">
              <header className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                  {level.order}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Level {level.order}</p>
                  <h3 id={`level-title-${level.id}`} className="mt-1 text-lg font-semibold text-neutral-900">
                    {level.title}
                  </h3>
                </div>
              </header>
              <p className="leading-7 text-neutral-600">{level.storyText}</p>
              <div className="rounded-lg bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Your challenge</p>
                <p className="mt-1 text-sm leading-6 text-neutral-700">{level.codingChallenge}</p>
              </div>
              <SubmissionForm levelId={level.id} />
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}