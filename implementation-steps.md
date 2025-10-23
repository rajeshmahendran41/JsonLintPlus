# Implementation Steps for Real-time Syntax Highlighting and Error Navigation

## Step 1: Add CSS for Error Highlighting

Add the following CSS styles to the inline style block in index.html (around line 150):

```css
/* Error highlighting styles */
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

## Step 2: Add State Variable for Error Information

Add this state variable after the existing currentMode state variable (around line 317):

```javascript
// State
let currentMode = 'input';
let isHighlighting = false;
let currentError = null; // To store current error information
```

## Step 3: Add Error Parsing Function

Add this function after the applySyntaxHighlighting function (around line 756):

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

## Step 4: Add Error Highlighting Functions

Add these functions after the parseJSONError function:

```javascript
// Highlight error line with red background
function highlightErrorLine(lineNumber) {
  const contentArea = elements.jsonOutput;
  const content = contentArea.innerHTML;
  const lines = content.split('\n');
  
  if (lineNumber > 0 && lineNumber <= lines.length) {
    // Wrap error line with error span
    lines[lineNumber - 1] = `<span class="error-line">${lines[lineNumber - 1]}</span>`;
    contentArea.innerHTML = lines.join('\n');
    
    // Re-apply syntax highlighting to maintain colors
    applySyntaxHighlighting(contentArea);
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
  
  // Reset error state
  currentError = null;
  
  // Update line numbers without error highlight
  updateLineNumbers();
}
```

## Step 5: Update Line Numbers Function

Modify the updateLineNumbers function to accept an optional errorLine parameter:

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

## Step 6: Update Validation Functions

Update the validateJSON, formatJSON, and minifyJSON functions to include error handling:

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
    currentError = errorInfo;
    
    // Show error notification
    showNotification(`Invalid JSON: ${error.message} (Line ${errorInfo.line}, Column ${errorInfo.column})`, 'error');
    
    // Navigate to error position and highlight if in output mode
    if (currentMode === 'output') {
      navigateToError(errorInfo);
      updateLineNumbers(errorInfo.line);
    }
    
    updateStatusBar({
      type: 'invalid',
      text: '✗ Invalid JSON',
      size: new Blob([input]).size
    });
  }
}

function formatJSON() {
  const startTime = performance.now();
  const input = currentMode === 'input' ? elements.jsonInput.value : getPlainTextFromEditor();
  
  if (!input.trim()) {
    showNotification('Please enter JSON data to format', 'error');
    return;
  }
  
  // Clear previous error highlights
  clearErrorHighlights();
  
  try {
    const parsed = JSON.parse(input);
    const formatted = JSON.stringify(parsed, null, 2);
    const endTime = performance.now();
    const parseTime = endTime - startTime;
    
    showOutput(formatted);
    showNotification('JSON formatted successfully', 'success');
    
    updateStatusBar({
      type: 'valid',
      text: '✓ JSON formatted',
      size: new Blob([input]).size,
      parseTime
    });
  } catch (error) {
    // Parse error information
    const errorInfo = parseJSONError(error.message, input);
    currentError = errorInfo;
    
    // Show error notification
    showNotification(`Invalid JSON: ${error.message} (Line ${errorInfo.line}, Column ${errorInfo.column})`, 'error');
    
    // Navigate to error position and highlight if in output mode
    if (currentMode === 'output') {
      navigateToError(errorInfo);
      updateLineNumbers(errorInfo.line);
    }
    
    updateStatusBar({
      type: 'invalid',
      text: '✗ Invalid JSON',
      size: new Blob([input]).size
    });
  }
}

function minifyJSON() {
  const startTime = performance.now();
  const input = currentMode === 'input' ? elements.jsonInput.value : getPlainTextFromEditor();
  
  if (!input.trim()) {
    showNotification('Please enter JSON data to minify', 'error');
    return;
  }
  
  // Clear previous error highlights
  clearErrorHighlights();
  
  try {
    const parsed = JSON.parse(input);
    const minified = JSON.stringify(parsed);
    const endTime = performance.now();
    const parseTime = endTime - startTime;
    
    showOutput(minified);
    showNotification('JSON minified successfully', 'success');
    
    updateStatusBar({
      type: 'valid',
      text: '✓ JSON minified',
      size: new Blob([input]).size,
      parseTime
    });
  } catch (error) {
    // Parse error information
    const errorInfo = parseJSONError(error.message, input);
    currentError = errorInfo;
    
    // Show error notification
    showNotification(`Invalid JSON: ${error.message} (Line ${errorInfo.line}, Column ${errorInfo.column})`, 'error');
    
    // Navigate to error position and highlight if in output mode
    if (currentMode === 'output') {
      navigateToError(errorInfo);
      updateLineNumbers(errorInfo.line);
    }
    
    updateStatusBar({
      type: 'invalid',
      text: '✗ Invalid JSON',
      size: new Blob([input]).size
    });
  }
}
```

## Step 7: Update Clear Function

Update the clearAll function to reset error state:

```javascript
function clearAll() {
  elements.jsonInput.value = '';
  elements.jsonOutput.innerHTML = '';
  elements.jsonOutput.removeAttribute('contenteditable');
  
  // Reset error state
  currentError = null;
  
  switchToInputMode();
  updateInfoPanel();
  updateLineNumbers();
  updateStatusBar({ text: 'Ready' });
  showNotification('Cleared all content', 'success');
}
```

## Step 8: Update Show Output Function

Update the showOutput function to ensure error highlights are cleared when showing new output:

```javascript
function showOutput(content) {
  // Clear any previous error highlights
  clearErrorHighlights();
  
  // Populate output and make editable
  elements.jsonOutput.textContent = content;
  elements.jsonOutput.setAttribute('contenteditable', 'true');

  // Apply syntax highlighting and switch mode
  applySyntaxHighlighting(elements.jsonOutput);
  switchToOutputMode();

  // Update line numbers in output mode
  updateLineNumbers();
}
```

## Step 9: Update Real-time Highlighting

Update the input event handler for the output area to ensure error highlights are maintained:

```javascript
// Output mode: allow editing and keep highlighting + line numbers updated
if (elements.jsonOutput) {
  // Live update with caret preservation (avoid caret jumping to start)
  elements.jsonOutput.addEventListener('input', () => {
    if (isHighlighting) return;
    updateLineNumbers(currentError ? currentError.line : null);
    updateInfoPanel();
    // Run highlight after the DOM updates to preserve caret
    requestAnimationFrame(() => {
      highlightOutputPreserveCaret();
      // Re-apply error highlighting if there's a current error
      if (currentError && currentMode === 'output') {
        highlightErrorLine(currentError.line);
      }
    });
  });
  
  // Paste as plain text to avoid HTML artifacts
  elements.jsonOutput.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    setTimeout(() => {
      updateLineNumbers(currentError ? currentError.line : null);
      updateInfoPanel();
      requestAnimationFrame(() => {
        highlightOutputPreserveCaret();
        // Re-apply error highlighting if there's a current error
        if (currentError && currentMode === 'output') {
          highlightErrorLine(currentError.line);
        }
      });
    }, 0);
  });
}
```

## Step 10: Update Mode Switching Functions

Update the switchToInputMode and switchToOutputMode functions to handle error state:

```javascript
function switchToInputMode() {
  currentMode = 'input';
  elements.editorWrapper.classList.remove('hidden');
  elements.outputWrapper.classList.remove('active');
  elements.currentMode.textContent = 'Input Mode';
  elements.currentMode.style.color = 'var(--text-secondary)';
  updateLineNumbers(currentError ? currentError.line : null);
}

function switchToOutputMode() {
  currentMode = 'output';
  elements.editorWrapper.classList.add('hidden');
  elements.outputWrapper.classList.add('active');
  elements.currentMode.textContent = 'Output Mode';
  elements.currentMode.style.color = 'var(--primary-color)';
  updateLineNumbers(currentError ? currentError.line : null);
}
```

## Testing

After implementing all the changes, test the following:

1. **Real-time Syntax Highlighting**
   - Type new characters and verify colors are applied immediately
   - Paste JSON content and verify syntax highlighting is applied instantly
   - Edit existing colored text and verify colors update correctly
   - Verify cursor position is maintained during re-highlighting

2. **Error Navigation**
   - Create invalid JSON and verify error banner shows line/column info
   - Verify cursor moves to error position automatically
   - Verify error line is highlighted with red background
   - Verify error line number is highlighted in line numbers panel
   - Verify page scrolls to error position if outside view
   - Test with different types of JSON errors

3. **Edge Cases**
   - Test with large JSON files (1000+ lines)
   - Test rapid typing with real-time highlighting
   - Test multiple paste operations
   - Test error at beginning of JSON
   - Test error at end of JSON
   - Test error in deeply nested structure