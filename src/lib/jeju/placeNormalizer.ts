/**
 * Helper function to extract values from objects regardless of field case
 */
export function normalizeField(obj: any, fieldNames: string[]): any {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  // Try exact matches first
  for (const field of fieldNames) {
    if (Object.prototype.hasOwnProperty.call(obj, field) && obj[field] !== undefined && obj[field] !== null) {
      return obj[field];
    }
  }

  // Try case-insensitive match
  const lowerFieldNames = fieldNames.map(f => f.toLowerCase());
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (lowerFieldNames.includes(lowerKey) && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }

  return undefined;
}
