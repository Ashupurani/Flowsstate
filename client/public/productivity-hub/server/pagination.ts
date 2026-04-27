// Pagination utilities for API endpoints

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export function getPaginationParams(query: any): PaginationParams {
  let limit = parseInt(query.limit || '20', 10);
  let offset = parseInt(query.offset || '0', 10);

  // Validate and constrain parameters
  if (isNaN(limit) || limit < 1) limit = 20;
  if (isNaN(offset) || offset < 0) offset = 0;
  if (limit > 100) limit = 100; // Max 100 per page

  return { limit, offset };
}

export function createPaginatedResponse<T>(
  data: T[],
  limit: number,
  offset: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total,
    },
  };
}
