/**
 * A deliberately small C++ tokenizer for the source glances. It only needs to
 * tell comments, strings, numbers, keywords and preprocessor lines apart, so
 * the listing can be printed in one ink colour with weight and tone carrying
 * the structure. It never alters the text: joining the tokens of every line
 * gives back the input exactly.
 */

export type CppTokenKind = 'plain' | 'keyword' | 'comment' | 'string' | 'number' | 'preproc';

export interface CppToken {
  kind: CppTokenKind;
  text: string;
}

const KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'goto',
  'const', 'constexpr', 'static', 'inline', 'extern', 'volatile', 'mutable',
  'void', 'bool', 'char', 'short', 'int', 'long', 'float', 'double', 'unsigned', 'signed', 'auto',
  'struct', 'class', 'enum', 'union', 'namespace', 'template', 'typename', 'using', 'typedef',
  'public', 'private', 'protected', 'virtual', 'override', 'final', 'friend', 'explicit', 'operator',
  'new', 'delete', 'this', 'nullptr', 'true', 'false', 'sizeof',
  'try', 'catch', 'throw', 'noexcept',
  'static_cast', 'reinterpret_cast', 'const_cast', 'dynamic_cast',
]);

const NUMBER = /^(?:0[xX][0-9a-fA-F']+|[0-9][0-9']*(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)[uUlLfF]*/;
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*/;
const PREPROCESSOR = /^(\s*)(#.*)$/;

/** One list of tokens per line of `code`. */
export function tokenizeCpp(code: string): CppToken[][] {
  let inBlockComment = false;

  return code.split('\n').map((line) => {
    const tokens: CppToken[] = [];
    let plain = '';
    const flush = () => {
      if (plain) tokens.push({ kind: 'plain', text: plain });
      plain = '';
    };
    const push = (kind: CppTokenKind, text: string) => {
      flush();
      tokens.push({ kind, text });
    };

    if (!inBlockComment) {
      const directive = PREPROCESSOR.exec(line);
      if (directive) {
        if (directive[1]) tokens.push({ kind: 'plain', text: directive[1] });
        tokens.push({ kind: 'preproc', text: directive[2] });
        return tokens;
      }
    }

    let i = 0;
    while (i < line.length) {
      if (inBlockComment) {
        const end = line.indexOf('*/', i);
        const stop = end === -1 ? line.length : end + 2;
        push('comment', line.slice(i, stop));
        inBlockComment = end === -1;
        i = stop;
        continue;
      }

      const ch = line[i];
      const next = line[i + 1];

      if (ch === '/' && next === '/') {
        push('comment', line.slice(i));
        break;
      }
      if (ch === '/' && next === '*') {
        const end = line.indexOf('*/', i + 2);
        const stop = end === -1 ? line.length : end + 2;
        push('comment', line.slice(i, stop));
        inBlockComment = end === -1;
        i = stop;
        continue;
      }
      if (ch === '"' || ch === "'") {
        let j = i + 1;
        while (j < line.length && line[j] !== ch) j += line[j] === '\\' ? 2 : 1;
        const stop = Math.min(j + 1, line.length);
        push('string', line.slice(i, stop));
        i = stop;
        continue;
      }
      if (ch >= '0' && ch <= '9') {
        const number = NUMBER.exec(line.slice(i));
        if (number) {
          push('number', number[0]);
          i += number[0].length;
          continue;
        }
      }
      const identifier = IDENTIFIER.exec(line.slice(i));
      if (identifier) {
        // Identifiers are consumed whole, so digits inside them never reach the number rule.
        if (KEYWORDS.has(identifier[0])) push('keyword', identifier[0]);
        else plain += identifier[0];
        i += identifier[0].length;
        continue;
      }

      plain += ch;
      i += 1;
    }

    flush();
    return tokens;
  });
}
