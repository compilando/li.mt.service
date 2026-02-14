import { describe, it, expect, vi } from "vitest";
import {
    AppError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    ValidationError,
    createSafeAction,
} from "@/lib/errors";

describe("Error Classes", () => {
    describe("AppError", () => {
        it("creates with default values", () => {
            const err = new AppError("Something went wrong");
            expect(err.message).toBe("Something went wrong");
            expect(err.statusCode).toBe(400);
            expect(err.code).toBe("BAD_REQUEST");
            expect(err.name).toBe("AppError");
            expect(err).toBeInstanceOf(Error);
        });

        it("creates with custom status code and error code", () => {
            const err = new AppError("Custom error", 500, "INTERNAL");
            expect(err.statusCode).toBe(500);
            expect(err.code).toBe("INTERNAL");
        });
    });

    describe("UnauthorizedError", () => {
        it("has correct defaults", () => {
            const err = new UnauthorizedError();
            expect(err.message).toBe("You must be signed in to perform this action");
            expect(err.statusCode).toBe(401);
            expect(err.code).toBe("UNAUTHORIZED");
            expect(err.name).toBe("UnauthorizedError");
        });

        it("accepts custom message", () => {
            const err = new UnauthorizedError("Session expired");
            expect(err.message).toBe("Session expired");
        });
    });

    describe("ForbiddenError", () => {
        it("has correct defaults", () => {
            const err = new ForbiddenError();
            expect(err.message).toBe("You do not have permission to perform this action");
            expect(err.statusCode).toBe(403);
            expect(err.code).toBe("FORBIDDEN");
            expect(err.name).toBe("ForbiddenError");
        });
    });

    describe("NotFoundError", () => {
        it("has correct defaults", () => {
            const err = new NotFoundError();
            expect(err.message).toBe("Resource not found");
            expect(err.statusCode).toBe(404);
            expect(err.code).toBe("NOT_FOUND");
        });

        it("includes resource name in message", () => {
            const err = new NotFoundError("Link");
            expect(err.message).toBe("Link not found");
        });
    });

    describe("ConflictError", () => {
        it("has correct defaults", () => {
            const err = new ConflictError();
            expect(err.message).toBe("This resource already exists");
            expect(err.statusCode).toBe(409);
            expect(err.code).toBe("CONFLICT");
        });
    });

    describe("RateLimitError", () => {
        it("has correct defaults", () => {
            const err = new RateLimitError();
            expect(err.statusCode).toBe(429);
            expect(err.code).toBe("RATE_LIMIT");
        });
    });

    describe("ValidationError", () => {
        it("stores validation errors", () => {
            const errors = { email: ["Invalid email"], name: ["Required"] };
            const err = new ValidationError(errors);
            expect(err.message).toBe("Validation failed");
            expect(err.statusCode).toBe(422);
            expect(err.code).toBe("VALIDATION_ERROR");
            expect(err.errors).toEqual(errors);
        });
    });

    describe("Error inheritance", () => {
        it("all errors extend AppError", () => {
            expect(new UnauthorizedError()).toBeInstanceOf(AppError);
            expect(new ForbiddenError()).toBeInstanceOf(AppError);
            expect(new NotFoundError()).toBeInstanceOf(AppError);
            expect(new ConflictError()).toBeInstanceOf(AppError);
            expect(new RateLimitError()).toBeInstanceOf(AppError);
            expect(new ValidationError({})).toBeInstanceOf(AppError);
        });

        it("all errors extend native Error", () => {
            expect(new UnauthorizedError()).toBeInstanceOf(Error);
            expect(new ForbiddenError()).toBeInstanceOf(Error);
        });
    });
});

describe("createSafeAction", () => {
    it("wraps successful handler result", async () => {
        const handler = vi.fn().mockResolvedValue({ id: "123" });
        const action = createSafeAction(handler);

        const result = await action("input");
        expect(result).toEqual({ success: true, data: { id: "123" } });
        expect(handler).toHaveBeenCalledWith("input");
    });

    it("catches AppError and returns failure", async () => {
        const handler = vi.fn().mockRejectedValue(new NotFoundError("Link"));
        const action = createSafeAction(handler);

        const result = await action("input");
        expect(result).toEqual({
            success: false,
            error: "Link not found",
            code: "NOT_FOUND",
        });
    });

    it("catches unexpected errors and returns generic message", async () => {
        const handler = vi.fn().mockRejectedValue(new Error("DB connection failed"));
        const action = createSafeAction(handler);

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        const result = await action("input");

        expect(result).toEqual({
            success: false,
            error: "An unexpected error occurred",
        });
        consoleSpy.mockRestore();
    });

    it("does not leak internal error details", async () => {
        const handler = vi.fn().mockRejectedValue(new Error("SQL injection detected: DROP TABLE users"));
        const action = createSafeAction(handler);

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        const result = await action("input");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).not.toContain("SQL");
            expect(result.error).not.toContain("DROP TABLE");
        }
        consoleSpy.mockRestore();
    });
});
