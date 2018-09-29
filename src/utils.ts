/**
 * Escape triple-quotes used for multi-line comments
 */
export function escapeComments(code: string): string {
  const s = code.replace(/\\/g, '\\\\');
  return s.replace(/"{3}/g, '\\"\\"\\"');
}
