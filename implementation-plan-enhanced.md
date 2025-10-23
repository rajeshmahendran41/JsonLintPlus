# Enhanced JSON Validator & Formatter Implementation Plan

## Overview
This document outlines the implementation plan for enhancing the JSON Validator & Formatter with line numbers, editable output, and proper scrolling functionality.

## Current Issues to Fix

1. Missing Line Numbers
2. Output is Not Editable (cannot re-edit formatted JSON)
3. Scrolling Not Working (content overflow not properly handled)

## Implementation Approach

### 1. HTML Structure Changes

#### Enhanced Editor Container
We'll modify the content area structure to include line numbers:

```html
<!-- Content container with line numbers and editor -->
<section class="content-container" aria-label="JSON editor">
  <div class="editor-container" id="editor-container">
    <div class="line-numbers" id="line-numbers">
      <div class="line-number">1</div>
    </div>
    <div class="editor-content">
      <!-- Input mode (textarea) -->
      <div class="editor-wrapper" id="editor-wrapper">
        <textarea id="json-input" class="json-editor" placeholder="Paste or type your JSON here..." aria-label="JSON input"></textarea>
      </div>
      
      <!-- Output mode (formatted display) -->
      <div class="output-wrapper" id="output-wrapper">
        <div id="json-output" class="json-output" contenteditable="true" aria-label="JSON output"></div>
      </div>
    </div>
  </div>
  
  <!-- Info panel with line/character count -->
  <div class="info-panel">
    <div class="line-info">
      <span id="line-count">0 lines</span> | 
      <span id="char-count">0 characters</span>
    </div>
    <div class="mode-indicator">
      <span id="current-mode">Input Mode</span>
    </div>
  </div>
</section>
```

### 2. CSS Enhancements

#### Line Numbers Styling
```css
.editor-container {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
  height: 500px; /* Fixed height for consistent scrolling */
  position: relative;
}

.line-numbers {
  background-color: var(--bg-tertiary);
  color: var(--text-muted);
  padding: 10px 8px;
  text-align: right;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;
  user-select: none;
  min-width: 50px;
  border-right: 1px solid var(--border-color);
  overflow-y: hidden; /* Controlled by JS sync */
  overflow-x: hidden; /* Never scroll horizontally */
  position: sticky;
  left: 0;
  z-index: 1;
}

.line-number {
  line-height: 1.5;
  height: 21px; /* Match content line height */
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
```

#### Scrollable Content Area
```css
.json-editor, .json-output {
  flex: 1;
  padding: 10px 15px;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;
  overflow-x: auto; /* Horizontal scroll */
  overflow-y: auto; /* Vertical scroll */
  white-space: pre; /* Preserve whitespace, enable horizontal scroll */
  word-wrap: break-word;
  border: none;
  outline: none;
  background-color: transparent;
  color: var(--text-primary);
  resize: none;
}

.json-editor::placeholder {
  color: var(--text-muted);
}

.json-output {
  white-space: pre-wrap; /* Allow text wrapping */
  word-break: break-word;
}

.json-output:focus {
  background-color: var(--bg-secondary);
  border-left: 2px solid var(--primary-color);
}

/* Custom scrollbar styling */
.json-editor::-webkit-scrollbar,
.json-output::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.json-editor::-webkit-scrollbar-track,
.json-output::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.json-editor::-webkit-scrollbar-thumb,
.json-output::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 5px;
}

.json-editor::-webkit-scrollbar-thumb:hover,
.json-output::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
```

### 3. JavaScript Implementation

#### Line Numbers Management
```javascript
// Function to update line numbers
function updateLineNumbers() {
  const content = currentMode === 'input' ? 
    elements.jsonInput.value : 
    elements.jsonOutput.innerText || elements.jsonOutput.textContent;
  
  const lines = content.split('\n').length;
  const lineNumbersDiv = document.getElementById('line-numbers');
  
  let lineNumbersHTML = '';
  for (let i = 1; i <= lines; i++) {
    lineNumbersHTML += `<div class="line-number">${i}</div>`;
  }
  lineNumbersDiv.innerHTML = lineNumbersHTML;
}

// Function to sync scroll between content and line numbers
function initializeScrollSync() {
  const contentAreas = [elements.jsonInput, elements.jsonOutput];
  const lineNumbers = document.getElementById('line-numbers');
  
  contentAreas.forEach(area => {
    if (area) {
      area.addEventListener('scroll', function() {
        lineNumbers.scrollTop = this.scrollTop;
      });
    }
  });
}
```

#### Editable Output with Syntax Highlighting
```javascript
// Function to display formatted JSON with syntax highlighting
function showOutput(content) {
  const outputElement = elements.jsonOutput;
  
  // Set the text content first
  outputElement.textContent = content;
  
  // Apply syntax highlighting
  applySyntaxHighlighting(outputElement);
  
  // Make it editable
  outputElement.contentEditable = true;
  
  // Switch to output mode
  switchToOutputMode();
  
  // Update line numbers
  updateLineNumbers();
}

// Function to get plain text from contentEditable div
function getPlainTextFromEditor() {
  const outputElement = elements.jsonOutput;
  return outputElement.innerText || outputElement.textContent;
}

// Modified validation functions to work with both input and output
function validateJSON() {
  const startTime = performance.now();
  const input = currentMode === 'input' ? 
    elements.jsonInput.value : 
    getPlainTextFromEditor();
  
  if (!input.trim()) {
    showNotification('Please enter JSON data to validate', 'error');
    return;
  }
  
  try {
    const parsed = JSON.parse(input);
    const endTime = performance.now();
    const parseTime = endTime - startTime;
    
    // Show success
    showOutput(JSON.stringify(parsed, null, 2));
    showNotification('✓ Valid JSON', 'success');
    
    updateStatusBar({
      type: 'valid',
      text: '✓ Valid JSON',
      size: new Blob([input]).size,
      parseTime
    });
  } catch (error) {
    showNotification('Invalid JSON: ' + error.message, 'error');
    if (currentMode === 'output') {
      // Highlight error in output mode
      highlightError(elements.jsonOutput, error.message);
    }
    
    updateStatusBar({
      type: 'invalid',
      text: '✗ Invalid JSON',
      size: new Blob([input]).size
    });
  }
}

// Similar updates for formatJSON and minifyJSON functions
```

#### Enhanced Syntax Highlighting for Editable Content
```javascript
// Enhanced syntax highlighting that works with contentEditable
function applySyntaxHighlighting(element) {
  let text = element.innerText || element.textContent;
  
  // Save current cursor position
  const selection = window.getSelection();
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const cursorOffset = range ? range.startOffset : 0;
  
  // Escape HTML
  let html = text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
  
  // Apply syntax highlighting
  html = html.replace(/"([^"]*)":/g, '<span class="json-key">"$1"</span>:');
  html = html.replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>');
  html = html.replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>');
  html = html.replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>');
  html = html.replace(/: null/g, ': <span class="json-null">null</span>');
  
  // Apply highlighting
  element.innerHTML = html;
  
  // Try to restore cursor position (approximate)
  if (range) {
    try {
      const newRange = document.createRange();
      const textNode = element.firstChild;
      if (textNode) {
        newRange.setStart(textNode, Math.min(cursorOffset, textNode.length));
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } catch (e) {
      // Ignore cursor restoration errors
    }
  }
}

// Function to handle input events in output mode
function setupOutputEditing() {
  elements.jsonOutput.addEventListener('input', function() {
    // Apply syntax highlighting after a short delay
    setTimeout(() => {
      applySyntaxHighlighting(elements.jsonOutput);
      updateLineNumbers();
      updateInfoPanel();
    }, 100);
  });
  
  elements.jsonOutput.addEventListener('paste', function(e) {
    e.preventDefault();
    
    // Get pasted data
    const text = e.clipboardData.getData('text/plain');
    
    // Insert plain text
    document.execCommand('insertText', false, text);
    
    // Update line numbers
    setTimeout(() => {
      updateLineNumbers();
      updateInfoPanel();
    }, 0);
  });
}
```

### 4. Mode Management Enhancements

#### Enhanced Mode Switching
```javascript
function switchToInputMode() {
  currentMode = 'input';
  elements.editorWrapper.classList.remove('hidden');
  elements.outputWrapper.classList.remove('active');
  elements.currentMode.textContent = 'Input Mode';
  elements.currentMode.style.color = 'var(--text-secondary)';
  updateLineNumbers();
}

function switchToOutputMode() {
  currentMode = 'output';
  elements.editorWrapper.classList.add('hidden');
  elements.outputWrapper.classList.add('active');
  elements.currentMode.textContent = 'Output Mode';
  elements.currentMode.style.color = 'var(--primary-color)';
  updateLineNumbers();
}
```

#### Enhanced Info Panel Updates
```javascript
function updateInfoPanel() {
  const text = currentMode === 'input' ? 
    elements.jsonInput.value : 
    getPlainTextFromEditor();
  
  const lines = text.split('\n').length;
  const chars = text.length;
  
  elements.lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
  elements.charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
}
```

### 5. Event Listener Setup

#### Initialize All Event Listeners
```javascript
function initializeEventListeners() {
  // Existing button listeners
  if (elements.validateBtn) elements.validateBtn.addEventListener('click', validateJSON);
  if (elements.formatBtn) elements.formatBtn.addEventListener('click', formatJSON);
  if (elements.minifyBtn) elements.minifyBtn.addEventListener('click', minifyJSON);
  if (elements.clearBtn) elements.clearBtn.addEventListener('click', clearAll);
  if (elements.copyBtn) elements.copyBtn.addEventListener('click', copyToClipboard);
  if (elements.sampleBtn) elements.sampleBtn.addEventListener('click', loadSampleJSON);
  if (elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Input event listeners
  if (elements.jsonInput) {
    elements.jsonInput.addEventListener('input', () => {
      updateInfoPanel();
      updateLineNumbers();
    });
  }
  
  // Output editing setup
  setupOutputEditing();
  
  // Initialize scroll sync
  initializeScrollSync();
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}
```

### 6. Responsive Design Considerations

#### Mobile Adjustments
```css
@media (max-width: 768px) {
  .editor-container {
    height: 400px;
  }
  
  .line-numbers {
    min-width: 40px;
    font-size: 12px;
  }
  
  .json-editor, .json-output {
    font-size: 12px;
    padding: 8px 10px;
  }
  
  .line-number {
    height: 18px;
  }
}
```

### 7. Performance Optimizations

#### Debounced Line Number Updates
```javascript
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Create debounced versions of update functions
const debouncedUpdateLineNumbers = debounce(updateLineNumbers, 100);
const debouncedUpdateInfoPanel = debounce(updateInfoPanel, 100);
```

#### Efficient Large JSON Handling
```javascript
function handleLargeJSON(content) {
  const lines = content.split('\n');
  
  // For very large JSON (>1000 lines), reduce update frequency
  if (lines.length > 1000) {
    // Update line numbers in chunks
    const chunkSize = 100;
    let currentLine = 1;
    
    function updateChunk() {
      const endLine = Math.min(currentLine + chunkSize, lines.length);
      updateLineNumbersRange(currentLine, endLine);
      currentLine = endLine;
      
      if (currentLine < lines.length) {
        setTimeout(updateChunk, 10);
      }
    }
    
    updateChunk();
  } else {
    updateLineNumbers();
  }
}
```

## Implementation Steps

1. **Modify HTML Structure**
   - Update content container to include line numbers
   - Make output area contenteditable
   - Update editor container structure

2. **Update CSS Styling**
   - Add line numbers styling
   - Implement proper scrolling behavior
   - Ensure responsive design

3. **Implement JavaScript Functions**
   - Line number management
   - Scroll synchronization
   - Editable output with syntax highlighting
   - Enhanced mode switching

4. **Update Event Handlers**
   - Modify validation functions to work with both modes
   - Add output editing event handlers
   - Implement debounced updates

5. **Testing and Optimization**
   - Test with various JSON sizes
   - Optimize for large files
   - Ensure responsive behavior

## Testing Checklist

- [ ] Line numbers appear on page load
- [ ] Line numbers update when typing new lines
- [ ] Line numbers update after formatting
- [ ] Line numbers scroll vertically with content
- [ ] Line numbers do NOT scroll horizontally
- [ ] Content scrolls vertically when exceeding max-height
- [ ] Content scrolls horizontally for long lines
- [ ] Can edit formatted JSON directly
- [ ] Can re-validate edited formatted JSON
- [ ] Scrollbar appears when content overflows
- [ ] Syntax highlighting remains after editing
- [ ] Line numbers stay aligned with content lines
- [ ] Performance is good with large JSON files (1000+ lines)
- [ ] Responsive design works on mobile devices