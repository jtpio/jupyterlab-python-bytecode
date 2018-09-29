import { expect } from 'chai';

import { escapeComments } from '../../src/utils';

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
});
