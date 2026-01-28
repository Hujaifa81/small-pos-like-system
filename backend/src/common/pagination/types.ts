export type SortOrder = 'asc' | 'desc';

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface IPaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages?: number;
}
