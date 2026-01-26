/**
 * Shared types for API responses and requests
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const createResponse = <T>(
  success: boolean,
  statusCode: number,
  data?: T,
  error?: { code: string; message: string; details?: unknown }
): ApiResponse<T> => {
  return {
    success,
    data,
    error,
    statusCode,
    timestamp: new Date().toISOString(),
  };
};

