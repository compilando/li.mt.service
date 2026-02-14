export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(message: string, statusCode: number = 400, code?: string) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code || "BAD_REQUEST";
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "You must be signed in to perform this action") {
        super(message, 401, "UNAUTHORIZED");
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "You do not have permission to perform this action") {
        super(message, 403, "FORBIDDEN");
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, 404, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}

export class ConflictError extends AppError {
    constructor(message = "This resource already exists") {
        super(message, 409, "CONFLICT");
        this.name = "ConflictError";
    }
}

export class RateLimitError extends AppError {
    constructor(message = "Too many requests. Please try again later") {
        super(message, 429, "RATE_LIMIT");
        this.name = "RateLimitError";
    }
}

export class ValidationError extends AppError {
    public readonly errors: Record<string, string[]>;

    constructor(errors: Record<string, string[]>) {
        super("Validation failed", 422, "VALIDATION_ERROR");
        this.name = "ValidationError";
        this.errors = errors;
    }
}

/**
 * Standard action result type for server actions
 */
export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

/**
 * Wrap a server action with error handling
 */
export function createSafeAction<TInput, TOutput>(
    handler: (input: TInput) => Promise<TOutput>,
) {
    return async (input: TInput): Promise<ActionResult<TOutput>> => {
        try {
            const data = await handler(input);
            return { success: true, data };
        } catch (error) {
            if (error instanceof AppError) {
                return { success: false, error: error.message, code: error.code };
            }
            console.error("Unexpected error in action:", error);
            return { success: false, error: "An unexpected error occurred" };
        }
    };
}
