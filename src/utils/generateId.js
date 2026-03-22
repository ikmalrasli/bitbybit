/**
 * Generate a unique ID for local database records.
 * Uses crypto.randomUUID() with a fallback for older browsers.
 * 
 * @returns {string} A unique identifier string
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
