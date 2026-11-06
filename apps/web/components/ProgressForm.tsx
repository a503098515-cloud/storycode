"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Level = { id: string; title: string; order: number };
type FormState = "empty" | "ready" | "submitting" | "error";

export function ProgressForm({
  levels,
  currentLevelId,
}: {
  levels: Level[];
  currentLevelId: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [state, setState] = useState<FormState>("empty");
  const [message, setMessage] = useState("");

  async function submit() {
    if (!value.trim() || state === "submitting") return;

    setState("submitting");
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentLevelId: value }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: { message?: string } };
        setMessage(result.error?.message ?? "Unable to save progress");
        setState("error");
        return;
      }

      setValue("");
      setMessage("");
      setState("empty");
      router.refresh();
    } catch {
      setMessage("Unable to save progress");
      setState("error");
    }
  }

  return (
    <section aria-labelledby="progress-heading" className="space-y-4 rounded-lg border border-neutral-200 p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Progress</p>
        <h2 id="progress-heading" className="text-lg font-semibold">Choose your current level</h2>
        <p className="text-sm text-neutral-500">
          {currentLevelId ? "Your saved progress is up to date." : "No level saved yet."}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          aria-label="Current level"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (state !== "submitting" && state !== "error") setState(event.target.value ? "ready" : "empty");
          }}
          className="min-h-10 flex-1 rounded-md border border-neutral-300 bg-white px-3 text-sm"
        >
          <option value="">Select a level</option>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              Level {level.order}: {level.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || state === "submitting"}
          className="min-h-10 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "submitting" ? "Saving..." : "Save progress"}
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("");
            setMessage("");
            setState("empty");
          }}
          className="min-h-10 rounded-md border border-neutral-300 px-4 text-sm font-medium"
        >
          Clear
        </button>
      </div>
      <p aria-live="polite" className={state === "error" ? "text-sm text-red-700" : "text-sm text-neutral-500"}>
        {state === "error" ? message : state === "submitting" ? "Saving progress..." : ""}
      </p>
    </section>
  );
}