import { expect } from 'chai';

import { escapeComments, parseBytecode } from '../../src/utils';

const LONG_KERNEL_CONTENT = `
  1           0 SETUP_LOOP              16 (to 18)
              2 LOAD_NAME                0 (range)
              4 LOAD_CONST               0 (10)
              6 CALL_FUNCTION            1
              8 GET_ITER
        >>   10 FOR_ITER                 4 (to 16)
             12 STORE_NAME               1 (i)


  4     >>   18 LOAD_CONST               1 (0)
             20 STORE_NAME               2 (j)


  2          14 JUMP_ABSOLUTE           10
        >>   16 POP_BLOCK


  5          22 SETUP_LOOP              20 (to 44)
        >>   24 LOAD_NAME                2 (j)
             26 LOAD_CONST               0 (10)
             28 COMPARE_OP               0 (<)
             30 POP_JUMP_IF_FALSE       42


  6          32 LOAD_NAME                2 (j)
             34 LOAD_CONST               2 (1)
             36 INPLACE_ADD
             38 STORE_NAME               2 (j)
             40 JUMP_ABSOLUTE           24
        >>   42 POP_BLOCK
        >>   44 LOAD_CONST               3 (None)
             46 RETURN_VALUE

`;

const formatCode = (...lines: string[]): string => {
  return lines.join('\n');
};

describe('utils', () => {
  describe('escapeComments', () => {
    it('should work with empty string', () => {
      const code = '';

      const escaped = escapeComments(code);

      expect(escaped).to.eq('');
    });

    it('should not escape single-line comments', () => {
      const code = formatCode(
        'import math',
        '# an important constant',
        'math.pi',
      );

      const escaped = escapeComments(code);

      expect(escaped).to.eq(code);
    });

    it('should escape docstrings', () => {
      const code = formatCode(
        'import math',
        '"""',
        'an important constant',
        '"""',
        'math.pi',
      );

      const escaped = escapeComments(code);

      const matches = escaped.match(/\\"\\"\\"/g);
      expect(matches).not.to.be.null;
      expect(matches.length).to.eq(2);
    });

    it('should escape empty docstrings and keep them', () => {
      const code = formatCode('import math', '""""""', '""""""', 'math.pi');

      const escaped = escapeComments(code);

      const matches = escaped.match(/\\"\\"\\"/g);
      expect(matches).not.to.be.null;
      expect(matches.length).to.eq(4);
      expect(escaped).to.include('\\"\\"\\"\\"\\"\\"');
    });
  });

  describe('parseBytecode', () => {
    it('should split into the correct number of lines', () => {
      const blocks = parseBytecode(LONG_KERNEL_CONTENT);
      expect(blocks.length).to.eq(5);
    });

    it('should return both the line number and the bytecode', () => {
      const blocks = parseBytecode(LONG_KERNEL_CONTENT);
      blocks.forEach(b => {
        expect(b).to.have.property('line');
        expect(b.line).not.to.be.null;
        expect(b).to.have.property('code');
        expect(b.code).not.to.be.null;
      });
    });

    it('should sort by line number', () => {
      const blocks = parseBytecode(LONG_KERNEL_CONTENT);
      const lines = blocks.map(b => b.line);
      const sortedLines = lines.sort((a, b) => a - b);
      expect(lines).to.eq(sortedLines);
    });
  });
});
