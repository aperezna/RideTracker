const SESSION_COOKIE_NAME = "ridetracker_session";
const SESSION_VALUE = "authenticated";

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
  const secret = process.env.APP_SESSION_SECRET ?? process.env.APP_MASTER_PASSWORD;
  if (!secret) throw new Error("APP_MASTER_PASSWORD is not configured");
  return secret;
}

export async function createSessionToken(): Promise<string> {
  const signature = await sign(SESSION_VALUE, sessionSecret());
  return `${toBase64Url(new TextEncoder().encode(SESSION_VALUE))}.${signature}`;
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [encodedValue, signature] = token.split(".");
  if (!encodedValue || !signature) return false;
  try {
    const value = new TextDecoder().decode(fromBase64Url(encodedValue));
    if (value !== SESSION_VALUE) return false;
    return (await sign(value, sessionSecret())) === signature;
  } catch {
    return false;
  }
}

export { SESSION_COOKIE_NAME };
