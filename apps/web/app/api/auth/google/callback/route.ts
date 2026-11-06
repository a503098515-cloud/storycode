import { finishOAuth } from "../../oauth";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return finishOAuth("google", request);
}
