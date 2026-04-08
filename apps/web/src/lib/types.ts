// Inlined from @da-apparels/types — avoids workspace dependency at build time

export interface BodyMeasurements {
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
  shoulder: number;
  sleeveLength: number;
  height: number;
  weight: number; // kg
  notes?: string;
}

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

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
