export const SUCCESS = 'SUCCESS';
export const INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR';
export const DATABASE_ERROR = 'DATABASE_ERROR';
export const INVALID_DATABASE_DATA = 'INVALID_DATABASE_DATA';
export const INVALID_FIELD = 'INVALID_FIELD';
export const INVALID_REFERENCE = 'INVALID_REFERENCE';
export const RECORD_NOT_FOUND = 'RECORD_NOT_FOUND';
export const INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN';
export const UNAUTHORIZED = 'UNAUTHORIZED';
export const FORBIDDEN = 'FORBIDDEN';
export const VALIDATION_ERROR = 'VALIDATION_ERROR';
export const ALREADY_EXISTS = 'ALREADY_EXISTS';
export const DUPLICATE_RECORD = 'DUPLICATE_RECORD';

export const ERROR_MESSAGES = {
  EMAIL_TAKEN: "An account with this email already exists",
  INVALID_CREDENTIALS: "Email or password is incorrect",
  INVALID_REFRESH_TOKEN: "Refresh token is invalid or expired",
  INVALID_TOKEN_TYPE: "Invalid token type",
  REFRESH_TOKEN_REVOKED: "Refresh token has been revoked",
  USER_NOT_FOUND: "User not found",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
  INVALID_RESET_TOKEN: "Password reset token is invalid or expired",
  VEHICLE_NOT_FOUND: "Vehicle not found",
  DRIVER_NOT_FOUND: "Driver not found",
  TRIP_NOT_FOUND: "Trip not found",
  MAINTENANCE_NOT_FOUND: "Maintenance record not found",
  VEHICLE_UNAVAILABLE: "Vehicle is not available",
  DRIVER_UNAVAILABLE: "Driver is unavailable or has an expired license",
  CAPACITY_EXCEEDED: "Cargo weight exceeds vehicle capacity",
  UNAUTHORIZED: "Access token is required",
  INVALID_ACCESS_TOKEN: "Invalid access token",
  ACCESS_TOKEN_EXPIRED: "Access token is invalid or expired",
  AUTHENTICATION_REQUIRED: "Authentication is required",
  ACCESS_DENIED: "Access denied. Action requires elevated privileges.",
  RESOURCE_NOT_FOUND: "Vehicle or driver was not found",
  ROUTE_NOT_FOUND: "Route not found",
  SMTP_FAILED: "SMTP setup error, failed to send reset email",
  VALIDATION_FAILED: "Validation failed",
  ONLY_DRAFT_DISPATCHABLE: "Only draft trips can be dispatched",
  ONLY_DISPATCHED_COMPLETABLE: "Only dispatched trips can be completed",
  ONLY_ACTIVE_CANCELLABLE: "Only draft or dispatched trips can be cancelled",
  VEHICLE_MAINTENANCE_BLOCKED: "Vehicle cannot be put into maintenance",
  MAINTENANCE_ALREADY_CLOSED: "Maintenance record is already closed",
  DUPLICATE_RECORD: "A record with that value already exists",
  ACTION_FORBIDDEN: "You do not have permission for this action",
  MODULE_ACCESS_DENIED: "You do not have access to this module",
  SMTP_NOT_CONFIGURED: "SMTP configuration is required to send password reset emails",
  SMTP_SEND_FAILED: "Failed to send password reset email",
  REFRESH_TOKEN_REQUIRED: "Refresh token is required"
} as const;
