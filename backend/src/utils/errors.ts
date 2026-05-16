/**
 * Domain-aware error classes. The error handler middleware maps these
 * to consistent JSON responses with appropriate HTTP status codes.
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_FAILED"
  | "STOCK_UNAVAILABLE"
  | "COUPON_INVALID"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_LOCKED"
  | "ACCOUNT_LOCKED"
  | "EMAIL_NOT_VERIFIED"
  | "PROFILE_INCOMPLETE"
  | "PRODUCT_UNAVAILABLE"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational = true;

  constructor(opts: {
    statusCode: number;
    code: ErrorCode;
    message: string;
    details?: unknown;
  }) {
    super(opts.message);
    this.name = "AppError";
    this.statusCode = opts.statusCode;
    this.code = opts.code;
    this.details = opts.details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export const ValidationError = (message: string, details?: unknown) =>
  new AppError({ statusCode: 422, code: "VALIDATION_ERROR", message, details });

export const Unauthorized = (message = "Authentication required") =>
  new AppError({ statusCode: 401, code: "UNAUTHORIZED", message });

export const Forbidden = (message = "Insufficient permissions") =>
  new AppError({ statusCode: 403, code: "FORBIDDEN", message });

export const NotFound = (message = "Resource not found") =>
  new AppError({ statusCode: 404, code: "NOT_FOUND", message });

export const Conflict = (message: string, details?: unknown) =>
  new AppError({ statusCode: 409, code: "CONFLICT", message, details });

export const RateLimited = (message = "Too many requests") =>
  new AppError({ statusCode: 429, code: "RATE_LIMITED", message });

export const StockUnavailable = (message = "Item is out of stock") =>
  new AppError({ statusCode: 409, code: "STOCK_UNAVAILABLE", message });

export const PaymentFailed = (message = "Payment failed or was not completed") =>
  new AppError({ statusCode: 402, code: "PAYMENT_FAILED", message });

export const CouponInvalid = (
  message: string,
  reason?:
    | "EXPIRED"
    | "INACTIVE"
    | "EXHAUSTED"
    | "MIN_ORDER"
    | "LIMIT_REACHED"
    | "FIRST_ORDER_ONLY"
    | "COD_NOT_ALLOWED"
    | "NOT_FOUND"
) =>
  new AppError({
    statusCode: 422,
    code: "COUPON_INVALID",
    message,
    details: reason ? { reason } : undefined,
  });

export const OtpInvalid = (message = "Invalid OTP") =>
  new AppError({ statusCode: 422, code: "OTP_INVALID", message });

export const OtpExpired = (message = "OTP has expired") =>
  new AppError({ statusCode: 422, code: "OTP_EXPIRED", message });

export const OtpLocked = (message = "OTP attempts exceeded — request a new code") =>
  new AppError({ statusCode: 429, code: "OTP_LOCKED", message });

export const AccountLocked = (message: string) =>
  new AppError({ statusCode: 423, code: "ACCOUNT_LOCKED", message });

export const EmailNotVerified = (message = "Please verify your email") =>
  new AppError({ statusCode: 403, code: "EMAIL_NOT_VERIFIED", message });

export const ProfileIncomplete = (missing: string[]) =>
  new AppError({
    statusCode: 422,
    code: "PROFILE_INCOMPLETE",
    message: "Profile incomplete — required fields missing",
    details: { missing },
  });

export const ProductUnavailable = (
  message: string,
  reason?: "VISIBILITY" | "PINCODE_RESTRICTED" | "OUT_OF_STOCK"
) =>
  new AppError({
    statusCode: 422,
    code: "PRODUCT_UNAVAILABLE",
    message,
    details: reason ? { reason } : undefined,
  });

export const ServiceUnavailable = (message: string) =>
  new AppError({ statusCode: 503, code: "SERVICE_UNAVAILABLE", message });
