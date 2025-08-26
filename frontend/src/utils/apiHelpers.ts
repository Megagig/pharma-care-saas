import { PaginatedResponse } from '../types/patientManagement';

/**
 * Safely extracts results from a resource response that could be either
 * PaginatedResponse<T> or { results: T[] }
 */
export function extractResults<T>(
  response: PaginatedResponse<T> | { results: T[] } | undefined
): T[] {
  if (!response) return [];

  // Check if it's a PaginatedResponse with data.results
  if ('data' in response && response.data && 'results' in response.data) {
    return response.data.results;
  }

  // Check if it has direct results property
  if ('results' in response) {
    return response.results;
  }

  return [];
}

/**
 * Safely extracts a single item from an API response
 */
export function extractData<T>(
  response: { data?: T } | T | undefined
): T | undefined {
  if (!response) return undefined;

  // Check if it's wrapped in a data property
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return response.data;
  }

  return response as T;
}
