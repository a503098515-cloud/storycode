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
      <ul aria-busy="true" className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {[0, 1].map((i) => (
          <li key={i} className="animate-pulse space-y-2 p-4">
            <div className="h-3 w-16 rounded bg-neutral-200" />
            <div className="h-4 w-48 rounded bg-neutral-200" />
            <div className="h-3 w-full rounded bg-neutral-100" />
          </li>
        ))}
      </ul>
    );
  }

  if (status === "signedOut") {
    return (
      <div className="rounded-lg border border-neutral-200 p-6 text-center">
        <p className="text-neutral-600">Your session ended.</p>
        <a href="/login" className="mt-3 inline-block rounded border border-neutral-300 px-3 py-1 text-sm">
          Sign in again
        </a>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{message}</p>
        <button onClick={reload} className="mt-3 rounded border border-red-300 px-3 py-1 text-sm">
          Retry
        </button>
      </div>
    );
  }

  // status === "ready". "Empty" is computed, not stored.
  if (levels.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-500">
        <p>No levels are available yet.</p>
        <button onClick={reload} className="mt-3 rounded border border-neutral-300 px-3 py-1 text-sm">
          Reload
        </button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
      {levels.map((level) => (
        <li key={level.id} className="space-y-2 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Level {level.order}</p>
          <h2 className="font-medium">{level.title}</h2>
          <p className="text-sm text-neutral-600">{level.storyText}</p>
          <p className="text-sm text-neutral-500">{level.codingChallenge}</p>
          {<SubmissionForm levelId={level.id} />}
        </li>
      ))}
    </ul>
  );
}