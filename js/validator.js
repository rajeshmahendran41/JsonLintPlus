'use strict';
(function () {
  function parseJSONError(errorMessage, jsonString) {
    let line = 1, column = 1, position = 0;
    const lcMatch = errorMessage.match(/line\s+(\d+)\s*(?:[,]|)\s*column\s+(\d+)/i);
    if (lcMatch) {
      line = parseInt(lcMatch[1], 10);
      column = parseInt(lcMatch[2], 10);
      if (jsonString) {
        const linesArr = jsonString.split('\n');
        position = 0;
        for (let i = 0; i < line - 1 && i < linesArr.length; i++) {
          position += linesArr[i].length + 1; // +1 for newline
        }
        position += Math.max(0, column - 1);
      }
    } else {
      const posMatch = errorMessage.match(/position\s+(\d+)/i);
      if (posMatch) {
        position = parseInt(posMatch[1], 10);
      }
      if (position > 0 && jsonString) {
        const before = jsonString.substring(0, position);
        const linesArr = before.split('\n');
        line = linesArr.length;
        column = (linesArr[linesArr.length - 1] || '').length + 1;
      }
    }
    return { line, column, position, message: errorMessage };
  }

  // Partial formatting until error
  function formatUntilError(jsonString, options = {}) {
    const indentation = options.indentation !== undefined ? options.indentation : 2;
    const indentStr = indentation === 'tab' ? '\t' : ' '.repeat(parseInt(indentation, 10) || 2);
    try {
      const parsed = JSON.parse(jsonString);
      const formattedFull = JSON.stringify(parsed, null, indentStr);
      return { isValid: true, formattedFull };
    } catch (err) {
      const errorInfo = parseJSONError(err.message, jsonString);
      const errorIndex = Math.max(0, Math.min((errorInfo.position || 0), jsonString.length));
      const partial = computePartialFormatting(jsonString, errorIndex, indentStr);
      const suffix = jsonString.slice(errorIndex);
      return {
        isValid: false,
        error: err.message,
        errorInfo,
        errorIndex,
        formattedPrefix: partial.formatted,
        suffix,
        formattedErrorOffset: partial.formattedErrorOffset,
        formattedContent: partial.formatted + suffix
      };
    }
  }

  // Lightweight streaming formatter that formats up to endIndex without requiring valid JSON closure
  function computePartialFormatting(src, endIndex, indentStr) {
    let out = '';
    let level = 0;
    let inString = false;
    let escape = false;
    const n = Math.max(0, Math.min(src.length, endIndex));

    for (let i = 0; i < n; i++) {
      const ch = src[i];

      if (inString) {
        out += ch;
        if (escape) {
          escape = false;
        } else if (ch === '\\') {
          escape = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        out += ch;
        continue;
      }

      if (ch === '{' || ch === '[') {
        out += ch + '\n' + indentStr.repeat(++level);
        continue;
      }

      if (ch === '}' || ch === ']') {
        level = Math.max(0, level - 1);
        // Trim any trailing spaces on current line before closing bracket
        out = out.replace(/[ \t]*$/, '');
        out += '\n' + indentStr.repeat(level) + ch;
        continue;
      }

      if (ch === ',') {
        out += ch + '\n' + indentStr.repeat(level);
        continue;
      }

      if (ch === ':') {
        out += ': ';
        continue;
      }

      if (/\s/.test(ch)) {
        // Collapse whitespace outside strings
        const prev = out[out.length - 1];
        if (prev && !/\s/.test(prev)) {
          out += ' ';
        }
        continue;
      }

      out += ch;
    }

    return { formatted: out, formattedErrorOffset: out.length };
  }

  // Incremental validation that returns first error position and partial formatted result
  function validateIncremental(jsonString, options = {}) {
    const indentation = options.indentation !== undefined ? options.indentation : 2;
    const indentStr = indentation === 'tab' ? '\t' : ' '.repeat(parseInt(indentation, 10) || 2);

    try {
      const parsed = JSON.parse(jsonString);
      const formattedFull = JSON.stringify(parsed, null, indentStr);
      return {
        isValid: true,
        parsed,
        formattedFull
      };
    } catch (err) {
      const errorInfo = parseJSONError(err.message, jsonString);
      const errorIndex = Math.max(0, Math.min((errorInfo.position || 0), jsonString.length));

      // Track tokenizer state up to errorIndex
      let level = 0;
      let inString = false;
      let escape = false;
      for (let i = 0; i < errorIndex; i++) {
        const ch = jsonString[i];
        if (inString) {
          if (escape) {
            escape = false;
          } else if (ch === '\\') {
            escape = true;
          } else if (ch === '"') {
            inString = false;
          }
          continue;
        }
        if (ch === '"') {
          inString = true;
          continue;
        }
        if (ch === '{' || ch === '[') {
          level++;
          continue;
        }
        if (ch === '}' || ch === ']') {
          level = Math.max(0, level - 1);
          continue;
        }
      }

      const partial = computePartialFormatting(jsonString, errorIndex, indentStr);
      const suffix = jsonString.slice(errorIndex);

      let expected = '';
      if (inString) {
        expected = 'terminating quote " for string';
      } else if (level > 0) {
        expected = 'closing brace/bracket or next value';
      } else {
        expected = 'value or end of input';
      }

      return {
        isValid: false,
        error: err.message,
        errorInfo,
        errorIndex,
        formattedPrefix: partial.formatted,
        suffix,
        formattedErrorOffset: partial.formattedErrorOffset,
        formattedContent: partial.formatted + suffix,
        tokenContext: { level, inString, escape },
        expected
      };
    }
  }

  // Expose API
  window.JSONValidator = { parseJSONError, formatUntilError, validateIncremental };
  })();