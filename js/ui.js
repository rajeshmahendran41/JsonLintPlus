'use strict';
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // Cache DOM elements
    const elements = {
      validateBtn: document.getElementById('validate-btn'),
      formatBtn: document.getElementById('format-btn'),
      minifyBtn: document.getElementById('minify-btn'),
      clearBtn: document.getElementById('clear-btn'),
      copyBtn: document.getElementById('copy-btn'),
      sampleBtn: document.getElementById('sample-btn'),
      themeToggle: document.getElementById('theme-toggle'),
      jsonInput: document.getElementById('json-input'),
      jsonOutput: document.getElementById('json-output'),
      editorWrapper: document.getElementById('editor-wrapper'),
      outputWrapper: document.getElementById('output-wrapper'),
      lineCount: document.getElementById('line-count'),
      charCount: document.getElementById('char-count'),
      currentMode: document.getElementById('current-mode'),
      validationStatus: document.getElementById('validation-status'),
      jsonSize: document.getElementById('json-size'),
      parseTime: document.getElementById('parse-time')
    };

    // State
    let currentMode = 'input';
    let isHighlighting = false;
    let currentError = null;
    let isPartialMode = false;

    // Sample JSON
    const sampleJSON = {
      name: 'John Doe',
      age: 30,
      city: 'New York',
      hobbies: ['reading', 'swimming', 'coding'],
      address: { street: '123 Main St', zipCode: '10001' },
      isActive: true,
      balance: null
    };

    // Event listeners
    if (elements.validateBtn) elements.validateBtn.addEventListener('click', validateJSON);
    if (elements.formatBtn) elements.formatBtn.addEventListener('click', formatJSON);
    if (elements.minifyBtn) elements.minifyBtn.addEventListener('click', minifyJSON);
    if (elements.clearBtn) elements.clearBtn.addEventListener('click', clearAll);
    if (elements.copyBtn) elements.copyBtn.addEventListener('click', copyToClipboard);
    if (elements.sampleBtn) elements.sampleBtn.addEventListener('click', loadSampleJSON);
    if (elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);

    // Input mode updates
    if (elements.jsonInput) {
      elements.jsonInput.addEventListener('input', () => {
        updateInfoPanel();
        updateLineNumbers();
      });
    }

    // Output mode updates with caret preservation and syntax highlighting
    if (elements.jsonOutput) {
      elements.jsonOutput.addEventListener('input', () => {
        if (isHighlighting) return;
        updateLineNumbers(currentError ? currentError.line : null);
        updateInfoPanel();
        requestAnimationFrame(() => {
          isHighlighting = true;
          const text = getPlainTextFromEditor();
          const MAX = window.JSONHighlighter ? window.JSONHighlighter.MAX_HIGHLIGHT_CHARS : 300000;
          if (text.length > MAX) {
            // Skip heavy highlighting for huge content to prevent hangs, but preserve caret
            const caretOffset = JSONHighlighter.getCaretOffset(elements.jsonOutput);
            elements.jsonOutput.textContent = text;
            elements.jsonOutput.classList.add('no-highlight');
            JSONHighlighter.setCaretOffset(elements.jsonOutput, Math.min(caretOffset, text.length));
            isHighlighting = false;
            return;
          }
          if (isPartialMode) {
            const prefixEl = elements.jsonOutput.querySelector('#formatted-prefix');
            if (prefixEl) {
              const __offset = JSONHighlighter.getCaretOffset(elements.jsonOutput);
              JSONHighlighter.applySyntaxHighlighting(prefixEl);
              const __len = (elements.jsonOutput.innerText || elements.jsonOutput.textContent || '').length;
              JSONHighlighter.setCaretOffset(elements.jsonOutput, Math.min(__offset, __len));
            }
          } else {
            JSONHighlighter.highlightOutputPreserveCaret(elements.jsonOutput);
          }
          isHighlighting = false;
          if (currentError && currentMode === 'output') {
            setErrorDecorations(currentError);
          }
        });
      });

      elements.jsonOutput.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        setTimeout(() => {
          updateLineNumbers(currentError ? currentError.line : null);
          updateInfoPanel();
          requestAnimationFrame(() => {
            isHighlighting = true;
            const fullText = getPlainTextFromEditor();
            const MAX = window.JSONHighlighter ? window.JSONHighlighter.MAX_HIGHLIGHT_CHARS : 300000;
            if (fullText.length > MAX) {
              // For extremely large paste, avoid regex and caret operations, but preserve caret
              const caretOffset = JSONHighlighter.getCaretOffset(elements.jsonOutput);
              elements.jsonOutput.textContent = fullText;
              elements.jsonOutput.classList.add('no-highlight');
              JSONHighlighter.setCaretOffset(elements.jsonOutput, Math.min(caretOffset, fullText.length));
              isHighlighting = false;
              return;
            }
            if (isPartialMode) {
              const prefixEl = elements.jsonOutput.querySelector('#formatted-prefix');
              if (prefixEl) {
                const __offset = JSONHighlighter.getCaretOffset(elements.jsonOutput);
                JSONHighlighter.applySyntaxHighlighting(prefixEl);
                const __len = (elements.jsonOutput.innerText || elements.jsonOutput.textContent || '').length;
                JSONHighlighter.setCaretOffset(elements.jsonOutput, Math.min(__offset, __len));
              }
            } else {
              JSONHighlighter.highlightOutputPreserveCaret(elements.jsonOutput);
            }
            isHighlighting = false;
            if (currentError && currentMode === 'output') {
              setErrorDecorations(currentError);
            }
          });
        }, 0);
      });
    }

    // Theme init
    const savedTheme = localStorage.getItem('jsonValidatorTheme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);

    // Initialize line numbers and scroll sync
    updateLineNumbers();
    initializeScrollSync();

    // Actions
    function validateJSON() {
      const startTime = performance.now();
      const input = currentMode === 'input' ? elements.jsonInput.value : getPlainTextFromEditor();
  
      if (!input.trim()) {
        showNotification('Please enter JSON data to validate', 'error');
        return;
      }
  
      clearErrorHighlights();
  
      try {
        const parsed = JSON.parse(input);
        const parseTime = performance.now() - startTime;
        showOutput(JSON.stringify(parsed, null, 2));
        showNotification('✓ Valid JSON', 'success');
        updateStatusBar({ type: 'valid', text: '✓ Valid JSON', size: new Blob([input]).size, parseTime });
      } catch (error) {
        // Incremental validation with partial formatting until error
        const result = JSONValidator.validateIncremental(input, { indentation: 2 });
        const formattedPrefix = result.formattedPrefix || '';
        const suffix = result.suffix || '';
        const linesBefore = formattedPrefix.split('\n');
        const displayLine = linesBefore.length;
        const displayColumn = (linesBefore[linesBefore.length - 1] || '').length + 1;
        const errorForDisplay = {
          ...result.errorInfo,
          line: displayLine,
          column: displayColumn,
          absoluteOffset: result.formattedErrorOffset
        };
        currentError = errorForDisplay;
        showPartialOutput(formattedPrefix, suffix, errorForDisplay);
        showNotification(`Invalid JSON: ${result.error} (Line ${errorForDisplay.line}, Column ${errorForDisplay.column})`, 'error');
        updateStatusBar({ type: 'invalid', text: '✗ Invalid JSON', size: new Blob([input]).size });
      }
    }

    function formatJSON() {
      const startTime = performance.now();
      const input = currentMode === 'input' ? elements.jsonInput.value : getPlainTextFromEditor();
  
      if (!input.trim()) {
        showNotification('Please enter JSON data to format', 'error');
        return;
      }
  
      clearErrorHighlights();
  
      try {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        const parseTime = performance.now() - startTime;
        showOutput(formatted);
        showNotification('JSON formatted successfully', 'success');
        updateStatusBar({ type: 'valid', text: '✓ JSON formatted', size: new Blob([input]).size, parseTime });
      } catch (error) {
        // Partial formatting until error point
        const result = JSONValidator.formatUntilError(input, { indentation: 2 });
        const formattedPrefix = result.formattedPrefix || '';
        const suffix = result.suffix || '';
        // Compute display line/column from formatted prefix
        const linesBefore = formattedPrefix.split('\n');
        const displayLine = linesBefore.length;
        const displayColumn = (linesBefore[linesBefore.length - 1] || '').length + 1;
        const errorForDisplay = {
          ...result.errorInfo,
          line: displayLine,
          column: displayColumn,
          absoluteOffset: result.formattedErrorOffset
        };
        currentError = errorForDisplay;
        showPartialOutput(formattedPrefix, suffix, errorForDisplay);
        showNotification(`Invalid JSON: ${result.error} (Line ${errorForDisplay.line}, Column ${errorForDisplay.column})`, 'error');
        updateStatusBar({ type: 'invalid', text: '✗ Invalid JSON (partial formatted)', size: new Blob([input]).size });
      }
    }

    function minifyJSON() {
      const startTime = performance.now();
      const input = currentMode === 'input' ? elements.jsonInput.value : getPlainTextFromEditor();

      if (!input.trim()) {
        showNotification('Please enter JSON data to minify', 'error');
        return;
      }

      clearErrorHighlights();

      try {
        const parsed = JSON.parse(input);
        const minified = JSON.stringify(parsed);
        const parseTime = performance.now() - startTime;
        showOutput(minified);
        showNotification('JSON minified successfully', 'success');
        updateStatusBar({ type: 'valid', text: '✓ JSON minified', size: new Blob([input]).size, parseTime });
      } catch (error) {
        const errorInfo = JSONValidator.parseJSONError(error.message, input);
        currentError = errorInfo;
        showNotification(`Invalid JSON: ${error.message} (Line ${errorInfo.line}, Column ${errorInfo.column})`, 'error');
        if (currentMode === 'output') {
          navigateToError(errorInfo);
        } else {
          navigateTextareaToError(errorInfo);
        }
        updateLineNumbers(errorInfo.line);
        updateStatusBar({ type: 'invalid', text: '✗ Invalid JSON', size: new Blob([input]).size });
      }
    }

    function clearAll() {
      elements.jsonInput.value = '';
      elements.jsonOutput.innerHTML = '';
      elements.jsonOutput.removeAttribute('contenteditable');
      currentError = null;
      switchToInputMode();
      updateInfoPanel();
      updateLineNumbers();
      updateStatusBar({ text: 'Ready' });
      showNotification('Cleared all content', 'success');
    }

    function copyToClipboard() {
      const text = currentMode === 'output' ? elements.jsonOutput.textContent : elements.jsonInput.value;
      if (!text.trim()) {
        showNotification('Nothing to copy', 'warning');
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard', 'success');
      }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copied to clipboard', 'success');
      });
    }

    function loadSampleJSON() {
      const jsonString = JSON.stringify(sampleJSON, null, 2);
      elements.jsonInput.value = jsonString;
      updateInfoPanel();
      showNotification('Sample JSON loaded', 'success');
    }

    function toggleTheme() {
      const currentTheme = document.body.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', newTheme);
      localStorage.setItem('jsonValidatorTheme', newTheme);
      updateThemeIcons(newTheme);
      showNotification(`Switched to ${newTheme} theme`, 'success');
    }

    function updateThemeIcons(theme) {
      const lightIcon = elements.themeToggle.querySelector('.theme-icon-light');
      const darkIcon = elements.themeToggle.querySelector('.theme-icon-dark');
      if (theme === 'light') {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'block';
      } else {
        lightIcon.style.display = 'block';
        darkIcon.style.display = 'none';
      }
    }

    // Line numbers
    function updateLineNumbers(errorLine = null) {
      const text = currentMode === 'input' ? elements.jsonInput.value : getPlainTextFromEditor();
      const MAX_LINE_RENDER = 2000;
      const LARGE_TEXT_THRESHOLD = 300000;
      const lineNumbersDiv = document.getElementById('line-numbers');
      if (!lineNumbersDiv) return;

      // Efficient newline count without allocating an array
      const newlineMatches = text.match(/\n/g);
      const lines = 1 + (newlineMatches ? newlineMatches.length : 0);

      // For extremely large inputs, avoid rendering thousands of line number nodes
      if (lines > MAX_LINE_RENDER || text.length > LARGE_TEXT_THRESHOLD) {
        lineNumbersDiv.innerHTML = `<div class="line-number">${lines} lines</div>`;
        return;
      }

      let html = '';
      for (let i = 1; i <= lines; i++) {
        const errorClass = i === errorLine ? ' error-line-number' : '';
        html += `<div class="line-number${errorClass}">${i}</div>`;
      }
      lineNumbersDiv.innerHTML = html;
    }

    function initializeScrollSync() {
      const lineNumbers = document.getElementById('line-numbers');
      if (!lineNumbers) return;
      if (elements.jsonInput) {
        elements.jsonInput.addEventListener('scroll', () => {
          lineNumbers.scrollTop = elements.jsonInput.scrollTop;
        });
      }
      if (elements.jsonOutput) {
        elements.jsonOutput.addEventListener('scroll', () => {
          lineNumbers.scrollTop = elements.jsonOutput.scrollTop;
          if (currentError && currentMode === 'output') {
            setErrorDecorations(currentError);
          }
        });
      }
    }

    // Output handling
    function showOutput(content) {
      clearErrorHighlights();
      elements.jsonOutput.textContent = content;
      elements.jsonOutput.setAttribute('contenteditable', 'true');
      isPartialMode = false;
      JSONHighlighter.applySyntaxHighlighting(elements.jsonOutput);
      switchToOutputMode();
      updateLineNumbers();
    }

    // Render formatted valid prefix + raw remainder, and decorate exact error
    function showPartialOutput(formattedPrefix, rawSuffix, errorInfo) {
      clearErrorHighlights();
      elements.jsonOutput.innerHTML = '';
      elements.jsonOutput.setAttribute('contenteditable', 'true');
      isPartialMode = true;

      const prefixEl = document.createElement('span');
      prefixEl.id = 'formatted-prefix';
      prefixEl.textContent = formattedPrefix || '';

      const suffixEl = document.createElement('span');
      suffixEl.id = 'raw-suffix';
      suffixEl.className = 'unformatted-suffix';
      suffixEl.textContent = rawSuffix || '';

      elements.jsonOutput.appendChild(prefixEl);
      elements.jsonOutput.appendChild(suffixEl);

      JSONHighlighter.applySyntaxHighlighting(prefixEl);
      switchToOutputMode();

      currentError = errorInfo || null;
      updateLineNumbers(currentError ? currentError.line : null);

      if (currentError) {
        setErrorDecorations(currentError);
        navigateToError(currentError);
      }
    }

    function getPlainTextFromEditor() {
      return elements.jsonOutput.innerText || elements.jsonOutput.textContent || '';
    }

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

    function updateInfoPanel() {
      const text = currentMode === 'input' ? elements.jsonInput.value : getPlainTextFromEditor();
      const newlineMatches = text.match(/\n/g);
      const lines = 1 + (newlineMatches ? newlineMatches.length : 0);
      const chars = text.length;
      elements.lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
      elements.charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    }

    function updateStatusBar(status) {
      elements.validationStatus.textContent = status.text || 'Ready';
      elements.validationStatus.className = 'status-indicator';
      if (status.type === 'valid') {
        elements.validationStatus.classList.add('valid');
      } else if (status.type === 'invalid') {
        elements.validationStatus.classList.add('invalid');
      }
      if (status.size && elements.jsonSize) {
        let sizeText = `${status.size} bytes`;
        if (status.size > 1024) sizeText = `${(status.size / 1024).toFixed(1)} KB`;
        elements.jsonSize.textContent = sizeText;
      }
      function formatDuration(ms) {
        if (!Number.isFinite(ms)) return '';
        if (ms < 0.01) return '<0.01ms';
        if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
        if (ms < 1000) return `${ms.toFixed(2)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
      }
      if ('parseTime' in status) {
        if (Number.isFinite(status.parseTime)) {
          elements.parseTime.textContent = `Parsed in ${formatDuration(status.parseTime)}`;
        } else {
          elements.parseTime.textContent = '';
        }
      }
    }

    function showNotification(message, type) {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      notification.setAttribute('role', 'alert');
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '4px',
        fontWeight: '500',
        zIndex: '3000',
        maxWidth: '300px',
        wordWrap: 'break-word',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
      });
      switch (type) {
        case 'success':
          notification.style.backgroundColor = '#4CAF50';
          notification.style.color = 'white';
          break;
        case 'error':
          notification.style.backgroundColor = '#f44336';
          notification.style.color = 'white';
          break;
        case 'warning':
          notification.style.backgroundColor = '#ff9800';
          notification.style.color = 'white';
          break;
        default:
          notification.style.backgroundColor = '#2196F3';
          notification.style.color = 'white';
      }
      document.body.appendChild(notification);
      setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 10);
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => { if (notification.parentNode) document.body.removeChild(notification); }, 300);
      }, 3000);
    }

    // Error decorations
    function setErrorDecorations(errorInfo) {
      const contentArea = elements.jsonOutput;
      if (!contentArea || !errorInfo) return;
  
      // Ensure overlay for the entire error line
      let overlay = contentArea.querySelector('#error-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'error-overlay';
        overlay.className = 'error-overlay';
        overlay.style.pointerEvents = 'none';
        contentArea.appendChild(overlay);
      }
  
      const cs = window.getComputedStyle(contentArea);
      const lineHeightPx = parseFloat(cs.lineHeight) || 21;
      const paddingTopPx = parseFloat(cs.paddingTop) || 0;

      const lineNum = Number.isFinite(errorInfo.line) ? errorInfo.line : 1;
      const top = paddingTopPx + (lineNum - 1) * lineHeightPx;
      overlay.style.top = `${top}px`;
      overlay.style.height = `${lineHeightPx}px`;

      // For very large content, avoid expensive DOM traversal for exact rect
      const contentText = getPlainTextFromEditor();
      const MAX = window.JSONHighlighter ? window.JSONHighlighter.MAX_HIGHLIGHT_CHARS : 300000;
      if (contentText.length > MAX) {
        updateLineNumbers(lineNum);
        return; // Overlay only
      }
  
      // Triangle marker above the exact character
      let marker = contentArea.querySelector('#error-marker');
      if (!marker) {
        marker = document.createElement('div');
        marker.id = 'error-marker';
        marker.className = 'error-marker';
        marker.style.pointerEvents = 'none';
        contentArea.appendChild(marker);
      }

      const offset = (typeof errorInfo.absoluteOffset === 'number') ? errorInfo.absoluteOffset : computeOffsetFromErrorInfo(errorInfo);
      const rect = getClientRectForOffset(contentArea, offset);
      const containerRect = contentArea.getBoundingClientRect();
  
      const markerHeight = 7;
      if (rect) {
        marker.style.top = `${rect.top - containerRect.top + contentArea.scrollTop - (markerHeight + 2)}px`;
        marker.style.left = `${rect.left - containerRect.left + contentArea.scrollLeft}px`;
      } else {
        marker.style.top = `${top - (markerHeight + 2)}px`;
        marker.style.left = `0px`;
      }

      // Vertical caret bar at the exact position
      let caret = contentArea.querySelector('#error-caret');
      if (!caret) {
        caret = document.createElement('div');
        caret.id = 'error-caret';
        caret.className = 'error-caret';
        caret.style.pointerEvents = 'none';
        contentArea.appendChild(caret);
      }
      if (rect) {
        caret.style.top = `${rect.top - containerRect.top + contentArea.scrollTop}px`;
        caret.style.left = `${rect.left - containerRect.left + contentArea.scrollLeft}px`;
        caret.style.height = `${Math.max(rect.height, lineHeightPx)}px`;
      } else {
        caret.style.top = `${top}px`;
        caret.style.left = `0px`;
        caret.style.height = `${lineHeightPx}px`;
      }
  
      updateLineNumbers(lineNum);
    }

    function computeOffsetFromErrorInfo(errorInfo) {
      const content = elements.jsonOutput.innerText || elements.jsonOutput.textContent || '';
      const lines = content.split('\n');
      let offset = 0;
      for (let i = 0; i < Math.max(0, errorInfo.line - 1) && i < lines.length; i++) {
        offset += lines[i].length + 1;
      }
      offset += Math.max(0, errorInfo.column - 1);
      return offset;
    }

    function getClientRectForOffset(el, targetOffset) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      let node, remaining = targetOffset;
      const range = document.createRange();
      while ((node = walker.nextNode())) {
        const len = node.textContent.length;
        if (remaining <= len) {
          range.setStart(node, Math.max(0, remaining));
          range.setEnd(node, Math.max(0, remaining));
          const rects = range.getClientRects();
          if (rects && rects.length) return rects[0];
          return range.getBoundingClientRect();
        }
        remaining -= len;
      }
      return null;
    }

    function scrollToLine(lineNumber) {
      const contentArea = elements.jsonOutput;
      const lineHeight = parseInt(window.getComputedStyle(contentArea).lineHeight);
      const scrollPosition = (lineNumber - 1) * lineHeight;
      const offset = contentArea.clientHeight / 2;
      contentArea.scrollTop = Math.max(0, scrollPosition - offset);
    }

    function navigateTextareaToError(errorInfo) {
      const ta = elements.jsonInput;
      if (!ta || !errorInfo) return;
      const text = ta.value || '';
      const lines = text.split('\n');
      let start = 0;
      for (let i = 0; i < Math.max(0, errorInfo.line - 1) && i < lines.length; i++) {
        start += lines[i].length + 1;
      }
      start += Math.max(0, errorInfo.column - 1);
      const end = start;
      ta.focus();
      try {
        ta.setSelectionRange(start, end);
      } catch (e) {
        setTimeout(() => ta.setSelectionRange(start, end), 0);
      }
      const cs = window.getComputedStyle(ta);
      const lineHeight = parseFloat(cs.lineHeight) || 21;
      const paddingTop = parseFloat(cs.paddingTop) || 0;
      const targetTop = paddingTop + (errorInfo.line - 1) * lineHeight;
      const offset = ta.clientHeight / 2;
      ta.scrollTop = Math.max(0, targetTop - offset);
    }

    function navigateToError(errorInfo) {
      const contentArea = elements.jsonOutput;
      const offset = (typeof errorInfo.absoluteOffset === 'number') ? errorInfo.absoluteOffset : computeOffsetFromErrorInfo(errorInfo);
      JSONHighlighter.setCaretOffset(contentArea, offset);
      scrollToLine(errorInfo.line);
      setErrorDecorations(errorInfo);
      contentArea.focus();
    }

    function clearErrorHighlights() {
      const contentArea = elements.jsonOutput;
      const overlay = contentArea.querySelector('#error-overlay');
      if (overlay) overlay.remove();
      const marker = contentArea.querySelector('#error-marker');
      if (marker) marker.remove();
      const caret = contentArea.querySelector('#error-caret');
      if (caret) caret.remove();
      currentError = null;
      updateLineNumbers();
    }

    // Initialize info panel and expose global API
    updateInfoPanel();
    window.jsonValidatorApp = {
      validateJSON,
      formatJSON,
      minifyJSON,
      clearAll,
      copyToClipboard,
      loadSampleJSON,
      toggleTheme
    };
  });
})();