/**
 * JSON.stringify replacer function to filter out sensitive fields
 */
export function createSafeReplacer() {
  const blockedFields = new Set(['password', '__v', 'hashedPassword']);
  
  return function(key: string, value: any) {
    if (blockedFields.has(key)) {
      return undefined;
    }
    return value;
  };
}

/**
 * Simple and direct sanitization using JSON parse/stringify
 * This approach is foolproof and works with any data structure
 */
export function sanitizeDocument(doc: any): any {
  if (!doc) return null;
  
  // Convert to JSON string, removing password fields, then parse back
  const jsonStr = JSON.stringify(doc, createSafeReplacer());
  return JSON.parse(jsonStr);
}

/**
 * Sanitize an array of documents
 */
export function sanitizeDocuments(docs: any[]): any[] {
  if (!Array.isArray(docs)) return docs;
  return docs.map(doc => sanitizeDocument(doc));
}

/**
 * Sanitize response data before sending to client
 */
export function sanitizeResponse(data: any): any {
  if (!data) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return sanitizeDocuments(data);
  }
  
  // Handle single documents
  if (typeof data === 'object') {
    return sanitizeDocument(data);
  }
  
  return data;
}
