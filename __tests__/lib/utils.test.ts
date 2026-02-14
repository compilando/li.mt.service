import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
    it("merges simple class names", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
        expect(cn("base", true && "active", false && "disabled")).toBe("base active");
    });

    it("handles undefined and null values", () => {
        expect(cn("base", undefined, null, "extra")).toBe("base extra");
    });

    it("merges Tailwind classes correctly (last wins)", () => {
        expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    });

    it("handles conflicting Tailwind classes", () => {
        expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("handles empty input", () => {
        expect(cn()).toBe("");
    });

    it("handles array inputs", () => {
        expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("handles object inputs", () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    });
});
