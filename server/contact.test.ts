import { describe, expect, it } from "vitest";
import { canReadContactInquiries, contactSubmissionAllowed, hasClearContactHoneypot, publicContactRateKey } from "./contact";

describe("public contact inquiry safeguards", () => {
  it("allows only the configured owner to read saved inquiries", () => {
    expect(canReadContactInquiries("owner-open-id", "owner-open-id")).toBe(true);
    expect(canReadContactInquiries("member-open-id", "owner-open-id")).toBe(false);
  });

  it("accepts clear honeypots and rejects automated honeypot values", () => {
    expect(hasClearContactHoneypot(" ")).toBe(true);
    expect(hasClearContactHoneypot("https://spam.example")).toBe(false);
  });

  it("uses the first forwarded address for a short public rate-limit window", () => {
    expect(publicContactRateKey("203.0.113.9, 10.0.0.2", "127.0.0.1")).toBe("203.0.113.9");
    expect(contactSubmissionAllowed([100, 200], 1000)).toBe(true);
    expect(contactSubmissionAllowed([100, 200, 300], 1000)).toBe(false);
  });
});
