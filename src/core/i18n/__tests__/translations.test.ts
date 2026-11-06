import { describe, expect, it } from "vitest";
import { resolveLocale } from "../server";
import { translate } from "../translations";

describe("locale resolution", () => {
  it("prefers a valid cookie over the browser language", () => {
    expect(resolveLocale("en", "es-ES,es;q=0.9")).toBe("en");
  });

  it("uses Spanish browser preferences when no cookie exists", () => {
    expect(resolveLocale(undefined, "es-ES,es;q=0.9,en;q=0.8")).toBe("es");
  });

  it("falls back to English for unsupported preferences", () => {
    expect(resolveLocale("fr", "de-DE,de;q=0.9")).toBe("en");
  });
});

describe("translations", () => {
  it("translates interpolated messages in both supported locales", () => {
    expect(translate("en", "dashboard.marked", { count: 3 })).toBe("3 marked");
    expect(translate("es", "dashboard.marked", { count: 3 })).toBe("3 marcados");
  });
});
