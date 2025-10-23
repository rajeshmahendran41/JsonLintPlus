/**
 * JSON Formatter Module
 * Handles JSON beautifying, minifying, and other formatting operations
 */

export class JSONFormatter {
  constructor() {
    this.defaultIndentation = 2;
    this.maxLineLength = 120;
    this.customReplacer = null;
  }

  /**
   * Beautifies JSON string with proper indentation
   * @param {string} jsonString - The JSON string to beautify
   * @param {number|string} indentation - Number of spaces or 'tab'
   * @param {Function} replacer - Custom replacer function
   * @returns {string} Beautified JSON string
   */
  beautify(jsonString, indentation = 2, replacer = null) {
    try {
      const parsed = JSON.parse(jsonString);
      const indent = this.getIndentationString(indentation);
      return JSON.stringify(parsed, replacer, indent);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }

  /**
   * Minifies JSON string by removing whitespace
   * @param {string} jsonString - The JSON string to minify
   * @param {Function} replacer - Custom replacer function
   * @returns {string} Minified JSON string
   */
  minify(jsonString, replacer = null) {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, replacer);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }

  /**
   * Sorts JSON object keys alphabetically
   * @param {string} jsonString - The JSON string to sort
   * @param {boolean} recursive - Whether to sort nested objects recursively
   * @returns {string} JSON string with sorted keys
   */
  sortKeys(jsonString, recursive = true) {
    try {
      const parsed = JSON.parse(jsonString);
      const sorted = recursive ? this.sortObjectKeysRecursive(parsed) : this.sortObjectKeys(parsed);
      return JSON.stringify(sorted, null, 2);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }

  /**
   * Removes empty properties from JSON
   * @param {string} jsonString - The JSON string to clean
   * @param {Object} options - Cleaning options
   * @returns {string} Cleaned JSON string
   */
  removeEmpty(jsonString, options = {}) {
    const {
      removeNull = true,
      removeUndefined = true,
      removeEmptyString = false,
      removeEmptyArray = false,
      removeEmptyObject = false
    } = options;

    try {
      const parsed = JSON.parse(jsonString);
      const cleaned = this.removeEmptyProperties(parsed, {
        removeNull,
        removeUndefined,
        removeEmptyString,
        removeEmptyArray,
        removeEmptyObject
      });
      return JSON.stringify(cleaned, null, 2);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }

  /**
   * Formats JSON with custom line breaks for better readability
   * @param {string} jsonString - The JSON string to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted JSON string
   */
  formatWithLineBreaks(jsonString, options = {}) {
    const {
      maxLineLength = this.maxLineLength,
      objectBreak = 'after',
      arrayBreak = 'after',
      indent = 2
    } = options;

    try {
      const parsed = JSON.parse(jsonString);
      return this.formatWithCustomBreaks(parsed, {
        maxLineLength,
        objectBreak,
        arrayBreak,
        indent
      });
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }

  /**
   * Converts JSON to a compact format with arrays on single lines
   * @param {string} jsonString - The JSON string to format
   * @param {number} indentation - Indentation for objects
   * @returns {string} Formatted JSON string
   */
  formatCompact(jsonString, indentation = 2) {
    try {
      const parsed = JSON.parse(jsonString);
      return this.formatCompactRecursive(parsed, indentation);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }

  /**
   * Validates and formats JSON in one operation
   * @param {string} jsonString - The JSON string to validate and format
   * @param {Object} options - Formatting options
   * @returns {Object} Result with formatted JSON and validation info
   */
  validateAndFormat(jsonString, options = {}) {
    const {
      indentation = 2,
      sortKeys = false,
      removeEmpty = false,
      format = 'beautify' // 'beautify', 'minify', 'compact'
    } = options;

    try {
      const parsed = JSON.parse(jsonString);
      let result = parsed;

      // Apply transformations
      if (sortKeys) {
        result = this.sortObjectKeysRecursive(result);
      }

      if (removeEmpty) {
        result = this.removeEmptyProperties(result);
      }

      // Format the result
      let formatted;
      switch (format) {
        case 'minify':
          formatted = JSON.stringify(result);
          break;
        case 'compact':
          formatted = this.formatCompactRecursive(result, indentation);
          break;
        case 'beautify':
        default:
          const indent = this.getIndentationString(indentation);
          formatted = JSON.stringify(result, null, indent);
          break;
      }

      return {
        isValid: true,
        formatted,
        originalSize: new Blob([jsonString]).size,
        formattedSize: new Blob([formatted]).size,
        compressionRatio: jsonString.length > 0 ? 
          (1 - formatted.length / jsonString.length) * 100 : 0
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        formatted: null
      };
    }
  }

  /**
   * Gets indentation string based on parameter
   * @param {number|string} indentation - Number of spaces or 'tab'
   * @returns {string|number} Indentation for JSON.stringify
   */
  getIndentationString(indentation) {
    if (indentation === 'tab') {
      return '\t';
    }
    return parseInt(indentation) || this.defaultIndentation;
  }

  /**
   * Recursively sorts object keys
   * @param {*} obj - Object to sort
   * @returns {*} Sorted object
   */
  sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    } else if (obj !== null && typeof obj === 'object') {
      const sortedKeys = Object.keys(obj).sort();
      const sortedObj = {};
      
      sortedKeys.forEach(key => {
        sortedObj[key] = obj[key];
      });
      
      return sortedObj;
    }
    
    return obj;
  }

  /**
   * Recursively sorts object keys at all levels
   * @param {*} obj - Object to sort
   * @returns {*} Sorted object
   */
  sortObjectKeysRecursive(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeysRecursive(item));
    } else if (obj !== null && typeof obj === 'object') {
      const sortedKeys = Object.keys(obj).sort();
      const sortedObj = {};
      
      sortedKeys.forEach(key => {
        sortedObj[key] = this.sortObjectKeysRecursive(obj[key]);
      });
      
      return sortedObj;
    }
    
    return obj;
  }

  /**
   * Recursively removes empty properties
   * @param {*} obj - Object to clean
   * @param {Object} options - Cleaning options
   * @returns {*} Cleaned object
   */
  removeEmptyProperties(obj, options = {}) {
    const {
      removeNull = true,
      removeUndefined = true,
      removeEmptyString = false,
      removeEmptyArray = false,
      removeEmptyObject = false
    } = options;

    if (Array.isArray(obj)) {
      return obj
        .map(item => this.removeEmptyProperties(item, options))
        .filter(item => {
          if (removeEmptyArray && Array.isArray(item) && item.length === 0) {
            return false;
          }
          if (removeEmptyObject && typeof item === 'object' && item !== null && Object.keys(item).length === 0) {
            return false;
          }
          return true;
        });
    } else if (obj !== null && typeof obj === 'object') {
      const cleanedObj = {};
      
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        
        // Skip values based on options
        if (removeNull && value === null) return;
        if (removeUndefined && value === undefined) return;
        if (removeEmptyString && value === '') return;
        
        // Recursively clean nested objects
        const cleanedValue = this.removeEmptyProperties(value, options);
        
        // Skip empty objects/arrays if options specify
        if (removeEmptyArray && Array.isArray(cleanedValue) && cleanedValue.length === 0) return;
        if (removeEmptyObject && typeof cleanedValue === 'object' && cleanedValue !== null && Object.keys(cleanedValue).length === 0) return;
        
        cleanedObj[key] = cleanedValue;
      });
      
      return cleanedObj;
    }
    
    return obj;
  }

  /**
   * Formats JSON with custom line breaks
   * @param {*} obj - Object to format
   * @param {Object} options - Formatting options
   * @param {number} depth - Current depth
   * @returns {string} Formatted JSON string
   */
  formatWithCustomBreaks(obj, options, depth = 0) {
    const {
      maxLineLength,
      objectBreak,
      arrayBreak,
      indent
    } = options;

    const indentStr = ' '.repeat(depth * (typeof indent === 'number' ? indent : 2));
    
    if (obj === null) {
      return 'null';
    } else if (typeof obj === 'string') {
      return JSON.stringify(obj);
    } else if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    } else if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return '[]';
      }
      
      const items = obj.map(item => 
        this.formatWithCustomBreaks(item, options, depth + 1)
      );
      
      const singleLine = '[' + items.join(', ') + ']';
      if (singleLine.length <= maxLineLength) {
        return singleLine;
      }
      
      const breakChar = arrayBreak === 'before' ? '\n' : ' ';
      return '[' + breakChar + items.map(item => 
        indentStr + '  ' + item
      ).join(',\n') + breakChar + indentStr + ']';
    } else if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return '{}';
      }
      
      const pairs = keys.map(key => {
        const value = this.formatWithCustomBreaks(obj[key], options, depth + 1);
        return JSON.stringify(key) + ': ' + value;
      });
      
      const singleLine = '{' + pairs.join(', ') + '}';
      if (singleLine.length <= maxLineLength) {
        return singleLine;
      }
      
      const breakChar = objectBreak === 'before' ? '\n' : ' ';
      return '{' + breakChar + pairs.map(pair => 
        indentStr + '  ' + pair
      ).join(',\n') + breakChar + indentStr + '}';
    }
    
    return String(obj);
  }

  /**
   * Formats JSON in compact style
   * @param {*} obj - Object to format
   * @param {number} indent - Indentation for objects
   * @param {number} depth - Current depth
   * @returns {string} Formatted JSON string
   */
  formatCompactRecursive(obj, indent, depth = 0) {
    const indentStr = ' '.repeat(depth * indent);
    
    if (obj === null) {
      return 'null';
    } else if (typeof obj === 'string') {
      return JSON.stringify(obj);
    } else if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    } else if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return '[]';
      }
      
      const items = obj.map(item => this.formatCompactRecursive(item, indent, depth + 1));
      
      // Keep arrays on single line if they're not too long
      const singleLine = '[' + items.join(', ') + ']';
      if (singleLine.length <= 100) {
        return singleLine;
      }
      
      return '[\n' + indentStr + '  ' + items.join(',\n' + indentStr + '  ') + '\n' + indentStr + ']';
    } else if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return '{}';
      }
      
      const pairs = keys.map(key => {
        const value = this.formatCompactRecursive(obj[key], indent, depth + 1);
        return indentStr + '  ' + JSON.stringify(key) + ': ' + value;
      });
      
      return '{\n' + pairs.join(',\n') + '\n' + indentStr + '}';
    }
    
    return String(obj);
  }

  /**
   * Gets statistics about JSON formatting
   * @param {string} original - Original JSON string
   * @param {string} formatted - Formatted JSON string
   * @returns {Object} Statistics object
   */
  getFormattingStats(original, formatted) {
    return {
      originalSize: new Blob([original]).size,
      formattedSize: new Blob([formatted]).size,
      originalLines: original.split('\n').length,
      formattedLines: formatted.split('\n').length,
      sizeChange: formatted.length - original.length,
      sizeChangePercent: original.length > 0 ? 
        ((formatted.length - original.length) / original.length) * 100 : 0
    };
  }
}