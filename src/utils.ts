const LINE_REGEX = /(^(\s*)(\d+)(?:(.|\r\n|\r|\n))+?(\r\n|\r|\n){2})/gim;

export interface IBytecodeBlock {
  line: number;
  code: string;
}

/**
 * Escape triple-quotes used for multi-line comments
 */
export function escapeComments(code: string): string {
  const s = code.replace(/\\/g, '\\\\');
  return s.replace(/"{3}/g, '\\"\\"\\"');
}

/**
 * Parse the CPython bytecode output from the call
 * to dis.dis
 */
export function parseBytecode(code: string): IBytecodeBlock[] {
  let matches = [];
  code += '\n\n'; // for the regex
  let match = LINE_REGEX.exec(code);
  while (match != null) {
    const line = parseInt(match[3], 10);
    matches.push({
      line: line - 1,
      code: match[2] + match[0].trim(),
    });
    match = LINE_REGEX.exec(code);
  }
  return matches.sort((a, b) => a.line - b.line);
}
