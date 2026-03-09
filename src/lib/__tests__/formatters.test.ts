import { describe, expect, it } from "vitest";
import { formatUSD, formatPct, timeAgo, truncateAddress } from "../formatters";

describe("formatUSD", () => {
  it("formats positive amount", () => {
    expect(formatUSD(1234.56)).toBe("$1234.56");
  });

  it("formats negative amount with sign", () => {
    expect(formatUSD(-42.5)).toBe("-$42.50");
  });

  it("formats zero", () => {
    expect(formatUSD(0)).toBe("$0.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatUSD(1.999)).toBe("$2.00");
  });
});

describe("formatPct", () => {
  it("formats decimal as percentage", () => {
    expect(formatPct(0.5)).toBe("50.0%");
  });

  it("formats small percentage", () => {
    expect(formatPct(0.042)).toBe("4.2%");
  });

  it("formats zero", () => {
    expect(formatPct(0)).toBe("0.0%");
  });

  it("formats negative percentage", () => {
    expect(formatPct(-0.15)).toBe("-15.0%");
  });
});

describe("timeAgo", () => {
  it('returns "never" for empty string', () => {
    expect(timeAgo("")).toBe("never");
  });

  it('returns "just now" for recent time', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const threeHrsAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeHrsAgo)).toBe("3h ago");
  });

  it("returns days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });
});

describe("truncateAddress", () => {
  it("truncates long address", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(addr)).toBe("0x123456...345678");
  });

  it("returns short address unchanged", () => {
    expect(truncateAddress("0x1234")).toBe("0x1234");
  });

  it("returns empty string unchanged", () => {
    expect(truncateAddress("")).toBe("");
  });

  it("respects custom chars param", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(addr, 4)).toBe("0x1234...5678");
  });
});
