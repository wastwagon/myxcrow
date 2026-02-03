/**
 * API Response Helpers
 * Utility functions for consistent API response data extraction
 */

/**
 * Extracts array data from API response
 * Handles multiple response formats:
 * - Direct array: [item1, item2, ...]
 * - Wrapped object: { data: [...], total: 10 }
 * - Named array: { escrows: [...], users: [...], etc. }
 */
export function extractArrayData<T>(
  responseData: T[] | { data?: T[]; [key: string]: any } | undefined | null,
  arrayKey?: string
): T[] {
  if (!responseData) return [];
  
  // If it's already an array, return it
  if (Array.isArray(responseData)) {
    return responseData;
  }
  
  // If it's an object, try to extract the array
  if (typeof responseData === 'object') {
    // Try common keys
    if (arrayKey && responseData[arrayKey]) {
      return Array.isArray(responseData[arrayKey]) ? responseData[arrayKey] : [];
    }
    
    // Try 'data' key
    if ('data' in responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    
    // Try common plural keys
    const commonKeys = ['escrows', 'users', 'disputes', 'wallets', 'payments', 'transactions'];
    for (const key of commonKeys) {
      if (key in responseData && Array.isArray(responseData[key])) {
        return responseData[key];
      }
    }
  }
  
  return [];
}

/**
 * Extracts single object from API response
 */
export function extractObjectData<T>(
  responseData: T | { data?: T; [key: string]: any } | undefined | null
): T | null {
  if (!responseData) return null;
  
  // If it's already the object type, return it
  if (typeof responseData === 'object' && !Array.isArray(responseData)) {
    // Check if it has a 'data' key
    if ('data' in responseData && responseData.data) {
      return responseData.data as T;
    }
    // Otherwise return as-is (assuming it's the object)
    return responseData as T;
  }
  
  return responseData as T;
}

/**
 * Extracts error message from API error
 */
export function extractErrorMessage(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
