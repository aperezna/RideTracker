const SESSION_COOKIE_NAME = "ridetracker_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

function sessionSecret(): string {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error("APP_SESSION_SECRET is not configured");
  return secret;
}

export async function createSessionToken(userId: string): Promise<string> {
  const value = `${userId}.${Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS}`;
  const signature = await sign(value, sessionSecret());
  return `${toBase64Url(new TextEncoder().encode(value))}.${signature}`;
}

export async function getSessionUserId(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const [encodedValue, signature] = token.split(".");
  if (!encodedValue || !signature) return null;
  try {
    const value = new TextDecoder().decode(fromBase64Url(encodedValue));
    const [userId, expiresAt] = value.split(".");
    if (!userId || !expiresAt || Number(expiresAt) < Math.floor(Date.now() / 1000)) return null;
    if ((await sign(value, sessionSecret())) !== signature) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  return (await getSessionUserId(token)) !== null;
}

export { SESSION_COOKIE_NAME };
