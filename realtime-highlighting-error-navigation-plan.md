# Real-time Syntax Highlighting and Error Navigation Implementation Plan

## Overview
This document outlines the implementation plan for adding real-time syntax highlighting while typing and automatic navigation to error positions when JSON validation fails.

## Current State
- Basic syntax highlighting is applied after validation/formatting
- Output is editable with contenteditable
- Line numbers are displayed and synchronized with content
- Basic error handling shows notification messages
- Cursor position preservation is implemented for highlighting operations

## New Requirements

### 1. Real-time Syntax Highlighting While Editing
- Apply syntax highlighting automatically as user types or edits
- When pasting new content, colors should be applied immediately
- Newly added characters/elements should get proper color coding
- Maintain cursor position during re-highlighting

### 2. Auto-navigate to Error Position
- When JSON parsing error occurs, automatically move cursor to error location
- Highlight the error line with a distinct background color
- Show visual indicator at exact error position
- Scroll to error position if it's outside visible area
- Parse JSON error to extract line and column number

## Implementation Approach

### 1. Real-time Syntax Highlighting Implementation

#### Option A: Immediate Highlighting on Input
- Implement input event listeners for the output area
- Save cursor position before highlighting
- Apply syntax highlighting to the entire content
- Restore cursor position after highlighting
- Update line numbers

#### Option B: Debounced Highlighting (Better Performance)
- Implement a debounce function to limit highlighting frequency
- Set a reasonable delay (300ms) to balance responsiveness and performance
- Particularly useful for large JSON files

#### Enhanced Syntax Highlighting Function
- Improve the existing applySyntaxHighlighting function
- Better regex patterns to handle edge cases (escaped quotes, etc.)
- Proper HTML escaping before highlighting

#### Cursor Position Management
- Implement getCursorOffset function to save cursor position
- Implement restoreCursorPosition function to restore cursor position
- Use TreeWalker API for accurate text node traversal

### 2. Error Navigation Implementation

#### Error Position Parsing
- Implement parseJSONError function to extract line and column from error message
- Handle different error message formats from various browsers
- Calculate character offset for cursor positioning

#### Error Highlighting
- Implement highlightErrorLine function to highlight the error line
- Add CSS classes for error line styling
- Implement error marker at exact error position

#### Cursor Navigation
- Implement moveCursorToPosition function to move cursor to error position
- Use Range API for precise cursor positioning
- Ensure cursor is visible after navigation

#### Scroll to Error
- Implement scrollToLine function to scroll to error position
- Center the error line in the viewport for better visibility
- Handle both vertical and horizontal scrolling

#### Line Number Error Highlighting
- Update updateLineNumbers function to highlight error line number
- Add CSS classes for error line number styling
- Ensure synchronization with content scrolling

## Detailed Implementation Plan

### 1. Enhanced Real-time Highlighting

#### JavaScript Functions

```javascript
// Real-time syntax highlighting function
function enableRealTimeSyntaxHighlight() {
  const contentArea = document.getElementById('json-output');
  
  contentArea.addEventListener('input', function(e) {
    // Avoid recursive highlighting
    if (isHighlighting) return;
    
    // Save current cursor position
    const cursorOffset = getCaretOffset(contentArea);
    
    // Apply syntax highlighting
    requestAnimationFrame(() => {
      applySyntaxHighlighting(contentArea);
      // Restore cursor position
      setCaretOffset(contentArea, cursorOffset);
      // Update line numbers
      updateLineNumbers();
    });
  });
}

// Enhanced syntax highlighting function
function applySyntaxHighlighting(element) {
  // Read plain text to avoid mixing HTML spans
  const text = element.innerText || element.textContent || '';
  
  // Properly escape HTML entities
  let html = text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
  
  // Apply syntax highlighting with improved regex
  html = html.replace(/"([^"\\]*(\\.[^"\\]*)*)":/g, '<span class="json-key">"$1"</span>:');
  html = html.replace(/:\s*"([^"\\]*(\\.[^"\\]*)*)"/g, ': <span class="json-string">"$1"</span>');
  html = html.replace(/:\s*(-?\d+\.?\d*(?:[eE][+\-]?\d+)?)/g, ': <span class="json-number">$1</span>');
  html = html.replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>');
  html = html.replace(/:\s*null/g, ': <span class="json-null">null</span>');
  
  element.innerHTML = html;
}

// Cursor position utilities
function getCaretOffset(el) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  if (!el.contains(range.startContainer)) return 0;

  let offset = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    if (node === range.startContainer) {
      offset += range.startOffset;
      break;
    } else {
      offset += node.textContent.length;
    }
  }
  return offset;
}

function setCaretOffset(el, offset) {
  const selection = window.getSelection();
  const range = document.createRange();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let node;
  let remaining = offset;
  while ((node = walker.nextNode())) {
    const len = node.textContent.length;
    if (remaining <= len) {
      range.setStart(node, Math.max(0, remaining));
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= len;
  }
  // Fallback: put caret at end
  range.selectNodeContents(el);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}
```

#### Event Handlers

```javascript
// Handle paste events for immediate highlighting
elements.jsonOutput.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
  
  setTimeout(() => {
    const cursorOffset = getCaretOffset(elements.jsonOutput);
    applySyntaxHighlighting(elements.jsonOutput);
    setCaretOffset(elements.jsonOutput, cursorOffset);
    updateLineNumbers();
  }, 0);
});
```

### 2. Error Navigation Implementation

#### Error Position Parsing

```javascript
// Parse JSON error to extract line and column
function parseJSONError(errorMessage, jsonString) {
  let line = 1;
  let column = 1;
  let position = 0;
  
  // Extract position from error message
  const positionMatch = errorMessage.match(/position (\d+)/);
  if (positionMatch) {
    position = parseInt(positionMatch[1]);
  }
  
  // Calculate line and column from position
  if (position > 0 && jsonString) {
    const beforeError = jsonString.substring(0, position);
    const lines = beforeError.split('\n');
    line = lines.length;
    column = lines[lines.length - 1].length + 1;
  }
  
  return {
    line: line,
    column: column,
    position: position,
    message: errorMessage
  };
}
```

#### Error Highlighting and Navigation

```javascript
// Navigate cursor to error position and highlight
function navigateToError(errorInfo) {
  const contentArea = elements.jsonOutput;
  const content = contentArea.innerText || contentArea.textContent || '';
  const lines = content.split('\n');
  
  // Calculate character offset for the error position
  let offset = 0;
  for (let i = 0; i < errorInfo.line - 1; i++) {
    offset += lines[i].length + 1; // +1 for newline
  }
  offset += errorInfo.column - 1;
  
  // Highlight error line
  highlightErrorLine(errorInfo.line);
  
  // Move cursor to error position
  setCaretOffset(contentArea, offset);
  
  // Scroll to error position
  scrollToLine(errorInfo.line);
  
  // Focus the editor
  contentArea.focus();
}

// Highlight error line with red background
function highlightErrorLine(lineNumber) {
  const contentArea = elements.jsonOutput;
  const content = contentArea.innerHTML;
  const lines = content.split('\n');
  
  if (lineNumber > 0 && lineNumber <= lines.length) {
    // Wrap error line with error span
    lines[lineNumber - 1] = `<span class="error-line">${lines[lineNumber - 1]}</span>`;
    contentArea.innerHTML = lines.join('\n');
  }
}

// Scroll to specific line
function scrollToLine(lineNumber) {
  const contentArea = elements.jsonOutput;
  const lineHeight = parseInt(window.getComputedStyle(contentArea).lineHeight);
  const scrollPosition = (lineNumber - 1) * lineHeight;
  
  // Scroll with some offset to center the error line
  const offset = contentArea.clientHeight / 2;
  contentArea.scrollTop = Math.max(0, scrollPosition - offset);
}
```

#### Enhanced Validation Functions

```javascript
function validateJSON() {
  const startTime = performance.now();
  const input = currentMode === 'input' ? elements.jsonInput.value : getPlainTextFromEditor();
  
  if (!input.trim()) {
    showNotification('Please enter JSON data to validate', 'error');
    return;
  }
  
  // Clear previous error highlights
  clearErrorHighlights();
  
  try {
    const parsed = JSON.parse(input);
    const endTime = performance.now();
    const parseTime = endTime - startTime;
    
    // Show success and keep output editable
    showOutput(JSON.stringify(parsed, null, 2));
    showNotification('✓ Valid JSON', 'success');
    
    updateStatusBar({
      type: 'valid',
      text: '✓ Valid JSON',
      size: new Blob([input]).size,
      parseTime
    });
  } catch (error) {
    // Parse error information
    const errorInfo = parseJSONError(error.message, input);
    
    // Show error notification
    showNotification(`Invalid JSON: ${error.message} (Line ${errorInfo.line}, Column ${errorInfo.column})`, 'error');
    
    // Navigate to error position and highlight
    if (currentMode === 'output') {
      navigateToError(errorInfo);
    }
    
    updateStatusBar({
      type: 'invalid',
      text: '✗ Invalid JSON',
      size: new Blob([input]).size
    });
  }
}

// Clear previous error highlights
function clearErrorHighlights() {
  const contentArea = elements.jsonOutput;
  const errorLines = contentArea.querySelectorAll('.error-line');
  errorLines.forEach(el => {
    const parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
  });
  
  // Re-apply syntax highlighting after clearing errors
  applySyntaxHighlighting(contentArea);
}
```

### 3. Enhanced Line Numbers with Error Highlighting

```javascript
// Update line numbers with error highlighting
function updateLineNumbers(errorLine = null) {
  const text = currentMode === 'input'
    ? elements.jsonInput.value
    : getPlainTextFromEditor();
  
  const lines = text.split('\n').length || 1;
  const lineNumbersDiv = document.getElementById('line-numbers');
  if (!lineNumbersDiv) return;

  let html = '';
  for (let i = 1; i <= lines; i++) {
    const errorClass = (i === errorLine) ? ' error-line-number' : '';
    html += `<div class="line-number${errorClass}">${i}</div>`;
  }
  lineNumbersDiv.innerHTML = html;
}
```

## CSS Enhancements

### Error Highlighting Styles

```css
/* Error line highlighting */
.error-line {
  background-color: rgba(255, 0, 0, 0.1);
  display: inline-block;
  width: 100%;
  border-left: 3px solid #f44336;
  padding-left: 5px;
  animation: errorPulse 0.5s ease-in-out;
}

@keyframes errorPulse {
  0%, 100% {
    background-color: rgba(255, 0, 0, 0.1);
  }
  50% {
    background-color: rgba(255, 0, 0, 0.25);
  }
}

/* Error line number highlighting */
.line-number.error-line-number {
  background-color: #f44336;
  color: white;
  font-weight: bold;
  padding: 0 4px;
  border-radius: 2px;
}

/* Error marker at exact position */
.error-marker {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid #f44336;
  position: absolute;
  animation: errorBlink 1s infinite;
}

@keyframes errorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

## Implementation Steps

1. **Enhance Real-time Highlighting**
   - Update input event handlers for immediate highlighting
   - Improve cursor position preservation
   - Add paste event handling for immediate highlighting
   - Optimize for performance with debouncing if needed

2. **Implement Error Navigation**
   - Add error position parsing from error messages
   - Implement error line highlighting
   - Add cursor navigation to error position
   - Implement scroll to error position
   - Update line numbers to highlight error line

3. **Enhance Validation Functions**
   - Update validateJSON, formatJSON, and minifyJSON functions
   - Add error highlighting and navigation
   - Clear previous error highlights on new validation

4. **Add CSS Styles**
   - Add error line highlighting styles
   - Add error line number highlighting styles
   - Add error marker styles
   - Add animations for error highlighting

5. **Testing**
   - Test real-time highlighting while typing
   - Test paste events for immediate highlighting
   - Test cursor position preservation
   - Test error navigation with various JSON error types
   - Test error highlighting and line number highlighting
   - Test scroll to error position
   - Test performance with large JSON files

## Testing Checklist

### Real-time Syntax Highlighting
- [ ] Typing new characters applies colors immediately
- [ ] Pasting JSON applies syntax highlighting instantly
- [ ] Cursor position is maintained during re-highlighting
- [ ] Editing existing colored text updates colors correctly
- [ ] Performance is acceptable (no lag while typing)
- [ ] All JSON types colored correctly (strings, numbers, booleans, null, keys)

### Error Navigation
- [ ] Invalid JSON shows error banner with line/column info
- [ ] Cursor moves to error position automatically
- [ ] Error line is highlighted with red background
- [ ] Error line number is highlighted in line numbers panel
- [ ] Page scrolls to error position if outside view
- [ ] Multiple validations clear previous error highlights
- [ ] Error highlighting animates smoothly
- [ ] Works with different types of JSON errors

### Edge Cases
- [ ] Large JSON files (1000+ lines) - performance test
- [ ] Rapid typing with real-time highlighting
- [ ] Multiple paste operations
- [ ] Error at beginning of JSON
- [ ] Error at end of JSON
- [ ] Error in deeply nested structure
- [ ] Error with escaped characters in strings
- [ ] Error with Unicode characters