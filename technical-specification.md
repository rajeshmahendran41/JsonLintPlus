# JSON Validator & Formatter - Technical Specification

## HTML Structure

### Semantic Markup
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Validate, format, and beautify your JSON instantly">
  <title>JSON Validator & Formatter</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/theme.css">
  <link rel="stylesheet" href="css/responsive.css">
</head>
<body>
  <header class="app-header">
    <h1>JSON Validator & Formatter</h1>
    <p class="tagline">Validate, format, and beautify your JSON instantly</p>
  </header>

  <main class="app-main">
    <div class="toolbar">
      <div class="action-buttons">
        <button id="validate-btn" class="btn btn-primary">Validate</button>
        <button id="format-btn" class="btn btn-secondary">Format</button>
        <button id="minify-btn" class="btn btn-secondary">Minify</button>
        <button id="clear-btn" class="btn btn-danger">Clear</button>
        <button id="copy-btn" class="btn btn-secondary">Copy</button>
        <button id="sample-btn" class="btn btn-secondary">Sample</button>
      </div>
      <div class="toolbar-actions">
        <button id="settings-toggle" class="btn btn-icon" aria-label="Settings">
          <svg>...</svg>
        </button>
        <button id="theme-toggle" class="btn btn-icon" aria-label="Toggle theme">
          <svg>...</svg>
        </button>
      </div>
    </div>

    <div class="content-container">
      <div class="content-area" id="content-area">
        <div class="editor-wrapper" id="editor-wrapper">
          <textarea id="json-input" class="json-editor" placeholder="Paste or type your JSON here..."></textarea>
        </div>
        <div class="output-wrapper" id="output-wrapper" style="display: none;">
          <pre id="json-output" class="json-output"></pre>
        </div>
      </div>
      
      <div class="info-panel">
        <div class="line-info">
          <span id="line-count">0 lines</span> | 
          <span id="char-count">0 characters</span>
        </div>
      </div>
    </div>

    <div class="status-bar">
      <div class="status-info">
        <span id="validation-status" class="status-indicator">Ready</span>
        <span id="json-size" class="size-info">0 bytes</span>
        <span id="parse-time" class="time-info"></span>
      </div>
    </div>
  </main>

  <div class="settings-panel" id="settings-panel" style="display: none;">
    <div class="settings-content">
      <h3>Settings</h3>
      <div class="setting-group">
        <label for="indentation">Indentation</label>
        <select id="indentation">
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="tab">Tab</option>
        </select>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" id="real-time-validation">
          Real-time validation
        </label>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" id="auto-format">
          Auto-format on paste
        </label>
      </div>
    </div>
  </div>

  <div class="file-drop-overlay" id="file-drop-overlay" style="display: none;">
    <div class="drop-message">
      <svg>...</svg>
      <p>Drop JSON file here</p>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/codemirror@6.0.1/dist/index.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@codemirror/lang-json@6.0.1/dist/index.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@codemirror/theme-one-dark@6.1.2/dist/index.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

## CSS Architecture

### Main Stylesheet (css/style.css)
```css
/* CSS Variables for theming */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e0e0e0;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #dddddd;
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}

/* Base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
}

/* Header */
.app-header {
  background-color: var(--bg-primary);
  padding: 1.5rem 1rem;
  text-align: center;
  box-shadow: var(--shadow);
}

.app-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.tagline {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Main container */
.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: var(--bg-primary);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: var(--transition);
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: var(--text-primary);
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Content area */
.content-container {
  background-color: var(--bg-primary);
  border-radius: 8px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.content-area {
  position: relative;
  height: 500px;
}

.editor-wrapper, .output-wrapper {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.output-wrapper {
  opacity: 0;
  transform: translateX(20px);
  pointer-events: none;
}

.output-wrapper.active {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.editor-wrapper.hidden {
  opacity: 0;
  transform: translateX(-20px);
  pointer-events: none;
}

/* JSON editor and output */
.json-editor {
  width: 100%;
  height: 100%;
  padding: 1rem;
  border: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
}

.json-output {
  height: 100%;
  padding: 1rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Info panel */
.info-panel {
  padding: 0.5rem 1rem;
  background-color: var(--bg-tertiary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Status bar */
.status-bar {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background-color: var(--bg-primary);
  border-radius: 8px;
  box-shadow: var(--shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-indicator.valid {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.status-indicator.invalid {
  background-color: #ffebee;
  color: #c62828;
}

/* Settings panel */
.settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 300px;
  background-color: var(--bg-primary);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 1000;
}

.settings-panel.open {
  transform: translateX(0);
}

.settings-content {
  padding: 1.5rem;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.setting-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

/* File drop overlay */
.file-drop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.drop-message {
  background-color: var(--bg-primary);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from { 
    opacity: 0;
    transform: translateX(20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from { 
    opacity: 0;
    transform: translateX(-20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}
```

## JavaScript Implementation

### Main Application Controller (js/main.js)
```javascript
import { JSONValidator } from './validator.js';
import { JSONFormatter } from './formatter.js';
import { UIController } from './ui.js';
import { SettingsManager } from './settings.js';
import { FileHandler } from './fileHandler.js';
import { URLHandler } from './urlHandler.js';
import { KeyboardShortcuts } from './keyboard.js';

class JSONValidatorApp {
  constructor() {
    this.validator = new JSONValidator();
    this.formatter = new JSONFormatter();
    this.ui = new UIController();
    this.settings = new SettingsManager();
    this.fileHandler = new FileHandler();
    this.urlHandler = new URLHandler();
    this.keyboard = new KeyboardShortcuts();
    
    this.state = {
      mode: 'input',
      jsonInput: '',
      jsonOutput: '',
      validationResult: null,
      settings: this.settings.load()
    };
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.applySettings();
    this.loadInitialData();
    this.initializeEditor();
  }
  
  setupEventListeners() {
    // Button event listeners
    document.getElementById('validate-btn').addEventListener('click', () => this.validateJSON());
    document.getElementById('format-btn').addEventListener('click', () => this.formatJSON());
    document.getElementById('minify-btn').addEventListener('click', () => this.minifyJSON());
    document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());
    document.getElementById('copy-btn').addEventListener('click', () => this.copyToClipboard());
    document.getElementById('sample-btn').addEventListener('click', () => this.loadSampleJSON());
    
    // Settings toggle
    document.getElementById('settings-toggle').addEventListener('click', () => this.toggleSettings());
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
    
    // Settings changes
    document.getElementById('indentation').addEventListener('change', (e) => {
      this.settings.update('indentation', e.target.value);
    });
    
    document.getElementById('real-time-validation').addEventListener('change', (e) => {
      this.settings.update('realTimeValidation', e.target.checked);
      this.setupRealTimeValidation();
    });
    
    // File handling
    this.fileHandler.setupDragAndDrop();
    this.fileHandler.setupFileUpload();
    
    // Keyboard shortcuts
    this.keyboard.setup();
  }
  
  initializeEditor() {
    // Initialize CodeMirror editor
    const editorElement = document.getElementById('json-input');
    this.editor = new CodeMirror({
      parent: editorElement,
      extensions: [
        json(),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { padding: '1rem' }
        })
      ]
    });
    
    // Editor change event
    this.editor.on('change', () => {
      this.state.jsonInput = this.editor.state.doc.toString();
      this.updateInfoPanel();
      
      if (this.state.settings.realTimeValidation) {
        this.debounceValidation();
      }
    });
  }
  
  validateJSON() {
    const startTime = performance.now();
    this.state.validationResult = this.validator.validate(this.state.jsonInput);
    const endTime = performance.now();
    
    if (this.state.validationResult.isValid) {
      this.state.jsonOutput = this.state.validationResult.formatted;
      this.showOutput();
      this.ui.showSuccess('Valid JSON');
    } else {
      this.ui.showError(this.state.validationResult.error);
      this.highlightError(this.state.validationResult.line, this.state.validationResult.column);
    }
    
    this.updateStatusBar(endTime - startTime);
  }
  
  formatJSON() {
    try {
      this.state.jsonOutput = this.formatter.beautify(this.state.jsonInput, this.state.settings.indentation);
      this.showOutput();
      this.ui.showSuccess('JSON formatted successfully');
    } catch (error) {
      this.ui.showError('Invalid JSON: ' + error.message);
    }
  }
  
  minifyJSON() {
    try {
      this.state.jsonOutput = this.formatter.minify(this.state.jsonInput);
      this.showOutput();
      this.ui.showSuccess('JSON minified successfully');
    } catch (error) {
      this.ui.showError('Invalid JSON: ' + error.message);
    }
  }
  
  showOutput() {
    this.state.mode = 'output';
    const outputElement = document.getElementById('json-output');
    outputElement.textContent = this.state.jsonOutput;
    
    // Apply syntax highlighting
    this.highlightJSON(outputElement);
    
    // Animate transition
    this.ui.switchMode('output');
  }
  
  showInput() {
    this.state.mode = 'input';
    this.ui.switchMode('input');
  }
  
  highlightJSON(element) {
    // Simple syntax highlighting implementation
    let html = element.textContent;
    
    // Replace strings
    html = html.replace(/"([^"]*)":/g, '<span class="json-key">"$1"</span>:');
    html = html.replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>');
    
    // Replace numbers
    html = html.replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>');
    
    // Replace booleans
    html = html.replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>');
    
    // Replace null
    html = html.replace(/: null/g, ': <span class="json-null">null</span>');
    
    element.innerHTML = html;
  }
  
  clearAll() {
    this.state.jsonInput = '';
    this.state.jsonOutput = '';
    this.state.validationResult = null;
    this.editor.dispatch({
      changes: { from: 0, to: this.editor.state.doc.length, insert: '' }
    });
    this.showInput();
    this.ui.clearStatus();
    this.updateInfoPanel();
  }
  
  copyToClipboard() {
    const textToCopy = this.state.mode === 'output' ? this.state.jsonOutput : this.state.jsonInput;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.ui.showSuccess('Copied to clipboard');
    }).catch(() => {
      this.ui.showError('Failed to copy to clipboard');
    });
  }
  
  loadSampleJSON() {
    const sampleJSON = {
      "name": "John Doe",
      "age": 30,
      "city": "New York",
      "hobbies": ["reading", "swimming", "coding"],
      "address": {
        "street": "123 Main St",
        "zipCode": "10001"
      },
      "isActive": true,
      "balance": null
    };
    
    const jsonString = JSON.stringify(sampleJSON, null, 2);
    this.editor.dispatch({
      changes: { from: 0, to: this.editor.state.doc.length, insert: jsonString }
    });
    this.state.jsonInput = jsonString;
    this.updateInfoPanel();
  }
  
  updateInfoPanel() {
    const lines = this.state.jsonInput.split('\n').length;
    const chars = this.state.jsonInput.length;
    
    document.getElementById('line-count').textContent = `${lines} lines`;
    document.getElementById('char-count').textContent = `${chars} characters`;
  }
  
  updateStatusBar(parseTime) {
    const statusElement = document.getElementById('validation-status');
    const sizeElement = document.getElementById('json-size');
    const timeElement = document.getElementById('parse-time');
    
    if (this.state.validationResult) {
      if (this.state.validationResult.isValid) {
        statusElement.textContent = '✓ Valid JSON';
        statusElement.className = 'status-indicator valid';
      } else {
        statusElement.textContent = '✗ Invalid JSON';
        statusElement.className = 'status-indicator invalid';
      }
    } else {
      statusElement.textContent = 'Ready';
      statusElement.className = 'status-indicator';
    }
    
    sizeElement.textContent = `${new Blob([this.state.jsonInput]).size} bytes`;
    
    if (parseTime) {
      timeElement.textContent = `Parsed in ${parseTime.toFixed(2)}ms`;
    }
  }
  
  setupRealTimeValidation() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    if (this.state.settings.realTimeValidation) {
      this.editor.on('change', () => {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
          this.validateJSON();
        }, 300);
      });
    }
  }
  
  toggleSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    settingsPanel.classList.toggle('open');
  }
  
  toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    this.settings.update('theme', newTheme);
  }
  
  applySettings() {
    // Apply theme
    document.body.setAttribute('data-theme', this.state.settings.theme || 'light');
    
    // Apply indentation setting
    document.getElementById('indentation').value = this.state.settings.indentation || '2';
    
    // Apply real-time validation
    document.getElementById('real-time-validation').checked = this.state.settings.realTimeValidation || false;
    if (this.state.settings.realTimeValidation) {
      this.setupRealTimeValidation();
    }
  }
  
  loadInitialData() {
    // Check for URL parameters
    const urlData = this.urlHandler.parseURL();
    if (urlData.json) {
      this.state.jsonInput = urlData.json;
      this.editor.dispatch({
        changes: { from: 0, to: this.editor.state.doc.length, insert: urlData.json }
      });
      this.updateInfoPanel();
    }
    
    // Check for saved data in localStorage
    const savedData = localStorage.getItem('jsonValidatorData');
    if (savedData && !urlData.json) {
      try {
        const parsed = JSON.parse(savedData);
        this.state.jsonInput = parsed.jsonInput || '';
        if (this.state.jsonInput) {
          this.editor.dispatch({
            changes: { from: 0, to: this.editor.state.doc.length, insert: this.state.jsonInput }
          });
          this.updateInfoPanel();
        }
      } catch (e) {
        console.error('Failed to load saved data', e);
      }
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new JSONValidatorApp();
});
```

### JSON Validator (js/validator.js)
```javascript
export class JSONValidator {
  validate(jsonString) {
    if (!jsonString.trim()) {
      return {
        isValid: false,
        error: 'Please enter JSON data to validate',
        line: null,
        column: null
      };
    }
    
    try {
      const parsed = JSON.parse(jsonString);
      return {
        isValid: true,
        formatted: JSON.stringify(parsed, null, 2),
        data: parsed,
        error: null,
        line: null,
        column: null
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        formatted: null,
        data: null,
        line: this.extractLineNumber(error),
        column: this.extractColumnNumber(error)
      };
    }
  }
  
  extractLineNumber(error) {
    const match = error.message.match(/line (\d+)/i);
    return match ? parseInt(match[1]) : null;
  }
  
  extractColumnNumber(error) {
    const match = error.message.match(/column (\d+)/i);
    return match ? parseInt(match[1]) : null;
  }
  
  getErrorType(error) {
    if (error.message.includes('Unexpected token')) {
      return 'syntax';
    } else if (error.message.includes('Expecting')) {
      return 'expectation';
    } else if (error.message.includes('Unexpected end')) {
      return 'incomplete';
    } else {
      return 'unknown';
    }
  }
  
  getErrorMessage(error) {
    const errorType = this.getErrorType(error);
    
    switch (errorType) {
      case 'syntax':
        return 'Syntax error: Check for missing commas, quotes, or brackets';
      case 'expectation':
        return 'Invalid format: JSON keys must be in double quotes';
      case 'incomplete':
        return 'Incomplete JSON: Missing closing brackets or braces';
      default:
        return 'Invalid JSON: ' + error.message;
    }
  }
}
```

### JSON Formatter (js/formatter.js)
```javascript
export class JSONFormatter {
  beautify(jsonString, indentation = 2) {
    try {
      const parsed = JSON.parse(jsonString);
      const indent = indentation === 'tab' ? '\t' : parseInt(indentation);
      return JSON.stringify(parsed, null, indent);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }
  
  minify(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }
  
  sortKeys(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const sorted = this.sortObjectKeys(parsed);
      return JSON.stringify(sorted, null, 2);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }
  
  sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    } else if (obj !== null && typeof obj === 'object') {
      const sortedKeys = Object.keys(obj).sort();
      const sortedObj = {};
      
      sortedKeys.forEach(key => {
        sortedObj[key] = this.sortObjectKeys(obj[key]);
      });
      
      return sortedObj;
    }
    
    return obj;
  }
  
  removeEmptyProperties(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const cleaned = this.removeEmpty(parsed);
      return JSON.stringify(cleaned, null, 2);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  }
  
  removeEmpty(obj) {
    if (Array.isArray(obj)) {
      return obj.filter(item => {
        if (item === null || item === undefined || item === '') {
          return false;
        }
        return true;
      }).map(item => this.removeEmpty(item));
    } else if (obj !== null && typeof obj === 'object') {
      const cleanedObj = {};
      
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value !== null && value !== undefined && value !== '') {
          cleanedObj[key] = this.removeEmpty(value);
        }
      });
      
      return cleanedObj;
    }
    
    return obj;
  }
}
```

## Implementation Notes

### CodeMirror Integration
- Use CodeMirror 6 for the editor component
- Configure with JSON language support
- Implement custom themes for light/dark modes
- Add line numbers and basic editing features

### Performance Considerations
- Implement debouncing for real-time validation (300ms delay)
- Use Web Workers for processing large JSON files
- Implement virtual scrolling for very large outputs
- Cache formatted results to avoid reprocessing

### Error Handling
- Provide clear, actionable error messages
- Highlight error locations in the editor
- Categorize errors for better understanding
- Offer suggestions for common issues

### Accessibility
- Ensure all interactive elements are keyboard accessible
- Add ARIA labels for screen readers
- Implement focus management
- Provide high contrast themes

### Browser Compatibility
- Test on modern browsers (Chrome, Firefox, Safari, Edge)
- Provide fallbacks for older browsers
- Use feature detection where appropriate
- Minimize external dependencies

This technical specification provides a detailed blueprint for implementing the JSON Validator & Formatter website with a single content area that switches between input and output modes.