import { beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, getSessionUserId } from "../session";

describe("user sessions", () => {
  beforeEach(() => {
    process.env.APP_SESSION_SECRET = "test-session-secret";
  });

  it("binds a signed token to its user", async () => {
    const token = await createSessionToken("user-1");
    expect(await getSessionUserId(token)).toBe("user-1");
    expect(await getSessionUserId(`${token}tampered`)).toBeNull();
  });
});
