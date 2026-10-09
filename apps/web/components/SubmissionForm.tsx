"use client";

import { useState } from "react";

type FormStatus = "idle" | "submitting" | "error" | "success";

interface SubmissionFormProps {
  levelId: string;
}

export function SubmissionForm({ levelId }: SubmissionFormProps) {
  const [codeSubmitted, setCodeSubmitted] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEmpty = codeSubmitted.trim() === "";
  const isTooLong = codeSubmitted.length > 10000;
  const isSubmitting = status === "submitting";
  const isSubmitDisabled = isEmpty || isTooLong || isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId,
          codeSubmitted,
          isPassed: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to submit code, please try again");
      }

      setStatus("success");
      setCodeSubmitted("");
      setStatus("idle");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Network request failed, please check your connection");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-md bg-neutral-50 p-4 border border-neutral-200">
      <div>
        <label htmlFor={`code-${levelId}`} className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
          Your Solution
        </label>
        <textarea
          id={`code-${levelId}`}
          rows={4}
          value={codeSubmitted}
          disabled={isSubmitting}
          onChange={(e) => {
            setCodeSubmitted(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Write your code solution here..."
          className="w-full rounded border border-neutral-300 p-2 text-sm font-mono focus:border-neutral-500 focus:outline-none disabled:bg-neutral-100"
        />
        {isTooLong && (
          <p className="mt-1 text-xs text-red-500">
            Code length exceeds 10,000 characters limit ({codeSubmitted.length}/10000)
          </p>
        )}
      </div>

      {status === "error" && (
        <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
      )}

      {status === "success" && (
        <p className="text-xs text-green-600 font-medium">Code submitted successfully!</p>
      )}

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Submitting..." : "Submit Solution"}
      </button>
    </form>
  );
}