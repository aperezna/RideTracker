import { describe, expect, it } from "vitest";

import { extractWikipediaLeadText, extractWikipediaMetaContent } from "../wikimedia.service";

describe("Wikimedia image metadata", () => {
  it("extracts an image URL from Wikimedia Open Graph metadata", () => {
    const html = '<meta property="og:image" content="https://upload.wikimedia.org/example.jpg">';
    expect(extractWikipediaMetaContent(html, "og:image")).toBe("https://upload.wikimedia.org/example.jpg");
  });

  it("extracts Open Graph descriptions when standard descriptions are unavailable", () => {
    const html = '<meta property="og:description" content="A themed family ride.">';
    expect(extractWikipediaMetaContent(html, "og:description")).toBe("A themed family ride.");
  });

  it("extracts a useful lead paragraph when metadata is absent", () => {
    const html = "<p>This attraction is a themed ride through a detailed landscape with a story for visitors.</p>";
    expect(extractWikipediaLeadText(html)).toContain("This attraction is a themed ride");
  });
});
