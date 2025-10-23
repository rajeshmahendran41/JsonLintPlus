'use strict';
(function () {
  const MAX_HIGHLIGHT_CHARS = 300000;
  function applySyntaxHighlighting(element) {
    const text = element.innerText || element.textContent || '';
    if (text.length > MAX_HIGHLIGHT_CHARS) {
      // Skip regex-based highlighting for very large content to prevent UI hangs
      element.textContent = text;
      element.classList.add('no-highlight');
      return;
    }
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');html = html.replace(/"([^"]*)":/g, '<span class="json-key">"$1"</span>:');
    html = html.replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>');
    html = html.replace(/:\s*(-?\d+\.?\d*(?:[eE][+\-]?\d+)?)/g, ': <span class="json-number">$1</span>');
    html = html.replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>');
    html = html.replace(/:\s*null/g, ': <span class="json-null">null</span>');
    element.innerHTML = html;
  }

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
    range.selectNodeContents(el);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function highlightOutputPreserveCaret(el) {
    if (!el) return;
    const text = el.innerText || el.textContent || '';
    if (text.length > MAX_HIGHLIGHT_CHARS) {
      // Avoid expensive DOM ops for extremely large content, but preserve caret
      const offset = getCaretOffset(el);
      el.textContent = text;
      el.classList.add('no-highlight');
      setCaretOffset(el, Math.min(offset, text.length));
      return;
    }
    const offset = getCaretOffset(el);
    applySyntaxHighlighting(el);
    const textLen = (el.innerText || el.textContent || '').length;
    setCaretOffset(el, Math.min(offset, textLen));
  }

  window.JSONHighlighter = {
    applySyntaxHighlighting,
    getCaretOffset,
    setCaretOffset,
    highlightOutputPreserveCaret,
    MAX_HIGHLIGHT_CHARS
  };
})();