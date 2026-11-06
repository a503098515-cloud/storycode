import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { findOrCreateOAuthUser } from "@project/domain";
import { startSession } from "@project/auth";

type Provider = "google" | "github";

type ProviderConfig = {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  callbackPath: string;
};

type OAuthIdentity = {
  accountId: string;
  name: string;
  email: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getProviderConfig(provider: Provider): ProviderConfig {
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) {
    throw new Error(`${provider} OAuth credentials are not configured`);
  }

  const appUrl = process.env.APP_URL;
  if (!appUrl) throw new Error("APP_URL is not configured");
  const baseUrl = new URL(appUrl);
  if (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production");
  }

  return {
    clientId,
    clientSecret,
    authorizationUrl:
      provider === "google"
        ? "https://accounts.google.com/o/oauth2/v2/auth"
        : "https://github.com/login/oauth/authorize",
    tokenUrl:
      provider === "google"
        ? "https://oauth2.googleapis.com/token"
        : "https://github.com/login/oauth/access_token",
    callbackPath: `/api/auth/${provider}/callback`,
  };
}

function callbackUrl(config: ProviderConfig): string {
  return new URL(config.callbackPath, process.env.APP_URL).toString();
}

function stateCookieName(provider: Provider): string {
  return `oauth_state_${provider}`;
}

function verifierCookieName(provider: Provider): string {
  return `oauth_verifier_${provider}`;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 600,
  };
}

export async function beginOAuth(provider: Provider): Promise<Response> {
  const config = getProviderConfig(provider);
  const state = randomBytes(32).toString("hex");
  const verifier = randomBytes(32).toString("hex");
  const authorization = new URL(config.authorizationUrl);
  authorization.searchParams.set("client_id", config.clientId);
  authorization.searchParams.set("redirect_uri", callbackUrl(config));
  authorization.searchParams.set("response_type", "code");
  authorization.searchParams.set("state", state);
  authorization.searchParams.set(
    "code_challenge",
    createHash("sha256").update(verifier).digest("base64url")
  );
  authorization.searchParams.set("code_challenge_method", "S256");
  authorization.searchParams.set(
    "scope",
    provider === "google" ? "openid email profile" : "read:user"
  );
  if (provider === "google") authorization.searchParams.set("access_type", "online");

  const jar = await cookies();
  jar.set(stateCookieName(provider), state, cookieOptions());
  jar.set(verifierCookieName(provider), verifier, cookieOptions());
  return Response.redirect(authorization, 302);
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const value: unknown = await response.json();
  if (!isRecord(value)) throw new Error("OAuth provider returned an invalid response");
  return value;
}

async function exchangeCode(
  provider: Provider,
  config: ProviderConfig,
  code: string,
  verifier: string
): Promise<string> {
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: callbackUrl(config),
      code_verifier: verifier,
      ...(provider === "google" ? { grant_type: "authorization_code" } : {}),
    }),
  });
  if (!response.ok) throw new Error(`${provider} token exchange failed`);

  const data = await readJson(response);
  if (typeof data.access_token !== "string" || data.error) {
    throw new Error(`${provider} token exchange failed`);
  }
  return data.access_token;
}

async function getIdentity(provider: Provider, accessToken: string): Promise<OAuthIdentity> {
  const endpoint =
    provider === "google"
      ? "https://openidconnect.googleapis.com/v1/userinfo"
      : "https://api.github.com/user";
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(provider === "github" ? { "X-GitHub-Api-Version": "2022-11-28" } : {}),
    },
  });
  if (!response.ok) throw new Error(`${provider} profile request failed`);

  const profile = await readJson(response);
  if (provider === "google") {
    if (typeof profile.sub !== "string") throw new Error("Google profile has no account id");
    const email =
      profile.email_verified === true && typeof profile.email === "string"
        ? profile.email
        : null;
    return {
      accountId: profile.sub,
      name:
        (typeof profile.name === "string" && profile.name) ||
        email ||
        "Google user",
      email,
    };
  }

  if (
    (typeof profile.id !== "number" && typeof profile.id !== "string") ||
    typeof profile.login !== "string"
  ) {
    throw new Error("GitHub profile has no account id or login");
  }
  return {
    accountId: String(profile.id),
    name: (typeof profile.name === "string" && profile.name) || profile.login,
    email: typeof profile.email === "string" ? profile.email : null,
  };
}

export async function finishOAuth(
  provider: Provider,
  request: Request
): Promise<Response> {
  const url = new URL(request.url);
  const jar = await cookies();
  const cookieName = stateCookieName(provider);
  const expectedState = jar.get(cookieName)?.value;
  const verifierName = verifierCookieName(provider);
  const verifier = jar.get(verifierName)?.value;
  const receivedState = url.searchParams.get("state");
  jar.delete(cookieName);
  jar.delete(verifierName);

  if (
    !expectedState ||
    !receivedState ||
    !verifier ||
    !/^[a-f0-9]{64}$/.test(expectedState) ||
    !/^[a-f0-9]{64}$/.test(receivedState) ||
    !/^[a-f0-9]{64}$/.test(verifier) ||
    !timingSafeEqual(Buffer.from(expectedState), Buffer.from(receivedState))
  ) {
    return Response.redirect(new URL("/login?oauthError=state", process.env.APP_URL), 303);
  }

  const code = url.searchParams.get("code");
  if (!code || url.searchParams.has("error")) {
    return Response.redirect(new URL("/login?oauthError=provider", process.env.APP_URL), 303);
  }

  const config = getProviderConfig(provider);
  const accessToken = await exchangeCode(provider, config, code, verifier);
  const identity = await getIdentity(provider, accessToken);
  const user = await findOrCreateOAuthUser(
    provider,
    identity.accountId,
    identity.name,
    identity.email
  );
  await startSession(user.id);
  return Response.redirect(new URL("/", process.env.APP_URL), 303);
}
