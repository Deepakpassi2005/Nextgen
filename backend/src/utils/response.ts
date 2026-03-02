import { Response } from 'express';

/**
 * Sanitize object/array by removing password fields
 */
function sanitizeForResponse(data: any): any {
  if (!data) return data;
  
  const blocker = (key: string, value: any) => {
    // Block password, __v, and hashedPassword fields
    if (['password', '__v', 'hashedPassword'].includes(key)) {
      return undefined;
    }
    return value;
  };
  
  try {
    // Parse and stringify with replacer to completely remove sensitive fields
    const sanitized = JSON.parse(JSON.stringify(data, blocker));
    return sanitized;
  } catch (err) {
    console.error('[sanitize] Error sanitizing data:', err);
    return data;
  }
}

/**
 * Standardized success response helper.
 * @param res Express response object
 * @param data Payload to send back
 * @param status HTTP status code (defaults to 200)
 */
export function sendSuccess(res: Response, data: any, status = 200) {
  // Sanitize data before sending
  const cleanData = sanitizeForResponse(data);
  return res.status(status).json({ success: true, data: cleanData });
}

/**
 * Standardized error response helper.
 * @param res Express response object
 * @param message Error message
 * @param status HTTP status code (defaults to 500)
 */
export function sendError(res: Response, message: string, status = 500) {
  return res.status(status).json({ success: false, message });
}
