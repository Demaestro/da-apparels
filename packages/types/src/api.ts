/**
 * Standard API response envelope used by the NestJS backend.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * JWT payload — what lives inside the access token.
 */
export interface JwtPayload {
  sub: string;      // user.id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
