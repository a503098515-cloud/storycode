import { beginOAuth } from "../oauth";

export const dynamic = "force-dynamic";

export function GET() {
  return beginOAuth("github");
}
