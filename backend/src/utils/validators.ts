/**
 * Inspects `req.body` and ensures that all fields passed in `required`
 * are neither `undefined` nor an empty string. Returns an error message
 * when validation fails, otherwise `null`.
 */
export function requireFields(body: any, required: string[]): string | null {
  const missing = required.filter((key) => {
    const val = body[key];
    return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
  });
  if (missing.length > 0) {
    return `Missing required field(s): ${missing.join(', ')}`;
  }
  return null;
}
