import { currentUserId } from "@project/auth";
import { log } from "@project/log";

const MAX_TEXT_LENGTH = 12000;
const OLLAMA_TIMEOUT_MS = 20000;

function isString(value: unknown, maxLength = MAX_TEXT_LENGTH): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

type AssistMode = "hint" | "explain";

function buildPrompt(mode: AssistMode, challenge: string, code: string, results: string) {
  const task = mode === "explain"
    ? "All supplied tests passed. Break down why the student's code is correct, step by step, in plain language. Refer to the student's actual code and the challenge. Do not propose a different solution or add code."
    : "Give exactly one subtle Socratic question, no more than 25 words, that directs attention to a relevant input, output, or failing expectation. Do not describe the algorithm, list steps, say what to change, include code or pseudocode, provide an exact replacement, or reveal the final answer.";

  return [
    "You are a patient JavaScript coding challenge tutor.",
    task,
    "Do not claim tests passed unless the supplied results say they passed.",
    "Keep the response under 180 words and do not use markdown headings.",
    `Challenge:\n${challenge}`,
    `Student code:\n${code}`,
    `Latest test results:\n${results}`,
  ].join("\n\n");
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: { code: "BAD_JSON", message: "Invalid JSON" } }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const mode = input.mode;
  const results = typeof input.results === "string" ? input.results : "";
  const resultLines = results.split("\n").map((line) => line.trim()).filter(Boolean);
  const allTestsPassed = resultLines.length > 0 && resultLines.every((line) => /^Test \d+: passed$/.test(line));
  if (
    (mode !== "hint" && mode !== "explain") ||
    !isString(input.challenge) ||
    !isString(input.code) ||
    !isString(input.results) ||
    (mode === "explain" ? !allTestsPassed : allTestsPassed)
  ) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "A mode, challenge, code, and test results are required" } },
      { status: 400 },
    );
  }

  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL ?? "mistral";

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: buildPrompt(mode, input.challenge, input.code, input.results),
        stream: false,
        options: { temperature: 0.2, num_predict: mode === "hint" ? 50 : 220 },
      }),
      signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
    });

    if (!response.ok) {
      log.warn({ userId, model, status: response.status }, "Ollama request failed");
      return Response.json(
        { error: { code: "OLLAMA_UNAVAILABLE", message: "Ollama is unavailable. Check that it is running with the Mistral model." } },
        { status: 503 },
      );
    }

    const data: unknown = await response.json();
    const answer = (data as { response?: unknown }).response;
    if (!isString(answer, 20000)) {
      return Response.json(
        { error: { code: "OLLAMA_INVALID_RESPONSE", message: "Ollama returned an unexpected response." } },
        { status: 502 },
      );
    }

    return Response.json({ answer: answer.trim(), model });
  } catch (err) {
    log.warn({ err, userId, model }, "Could not reach Ollama");
    return Response.json(
      { error: { code: "OLLAMA_UNAVAILABLE", message: "Ollama is unavailable. Check that it is running with the Mistral model." } },
      { status: 503 },
    );
  }
}