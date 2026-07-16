import { describe, expect, vi, it, afterEach } from "vitest";
import { getAllPoRules } from "@/lib/db";
import { getPoRulesAction } from "@/actions/poRules";
import type { IPoRule } from "@/types/interfaces";

vi.mock("@/lib/db", () => ({
  getAllPoRules: vi.fn(),
}));

describe("getPoRules", () => {
  const rules = [{ id: "rule-1" }] as unknown as IPoRule[];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns all rules on success", async () => {
    vi.mocked(getAllPoRules).mockResolvedValueOnce(rules);

    const result = await getPoRulesAction();

    expect(result).toEqual({ success: true, rules });
  });

  it("returns no rules on failure", async () => {
    vi.mocked(getAllPoRules).mockThrowOnce(rules);

    const result = await getPoRulesAction();

    expect(result).toEqual({
      error: "Failed to fetch PO rules",
      success: false,
      rules: [],
    });
  });
});
