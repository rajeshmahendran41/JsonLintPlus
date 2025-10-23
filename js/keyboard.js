/**
 * Keyboard Shortcuts Module
 * Handles keyboard navigation and shortcuts
 */

export class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.listeners = new Map();
    this.enabled = true;
    this.modifierKeys = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    };
    this.init();
  }

  /**
   * Initialize keyboard shortcuts
   */
  init() {
    this.setupDefaultShortcuts();
    this.setupEventListeners();
    this.setupModifierTracking();
  }

  /**
   * Setup default keyboard shortcuts
   */
  setupDefaultShortcuts() {
    // JSON operations
    this.addShortcut('ctrl+enter', 'validate', 'Validate JSON');
    this.addShortcut('ctrl+b', 'format', 'Format/Beautify JSON');
    this.addShortcut('ctrl+m', 'minify', 'Minify JSON');
    this.addShortcut('ctrl+k', 'clear', 'Clear all content');
    this.addShortcut('ctrl+c', 'copy', 'Copy to clipboard');
    
    // File operations
    this.addShortcut('ctrl+o', 'open', 'Open file');
    this.addShortcut('ctrl+s', 'save', 'Save/Download file');
    
    // UI operations
    this.addShortcut('ctrl+,', 'settings', 'Toggle settings');
    this.addShortcut('ctrl+d', 'theme', 'Toggle theme');
    this.addShortcut('escape', 'escape', 'Escape/Cancel');
    
    // Navigation
    this.addShortcut('ctrl+/', 'help', 'Show help');
    
    // Mac-specific alternatives
    if (this.isMac()) {
      this.addShortcut('meta+enter', 'validate', 'Validate JSON');
      this.addShortcut('meta+b', 'format', 'Format/Beautify JSON');
      this.addShortcut('meta+m', 'minify', 'Minify JSON');
      this.addShortcut('meta+k', 'clear', 'Clear all content');
      this.addShortcut('meta+c', 'copy', 'Copy to clipboard');
      this.addShortcut('meta+o', 'open', 'Open file');
      this.addShortcut('meta+s', 'save', 'Save/Download file');
      this.addShortcut('meta+,', 'settings', 'Toggle settings');
      this.addShortcut('meta+d', 'theme', 'Toggle theme');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Handle focus changes
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
    
    // Prevent default browser shortcuts
    document.addEventListener('keydown', this.preventBrowserShortcuts.bind(this));
  }

  /**
   * Setup modifier key tracking
   */
  setupModifierTracking() {
    document.addEventListener('keydown', (e) => {
      this.updateModifierKeys(e, true);
    });
    
    document.addEventListener('keyup', (e) => {
      this.updateModifierKeys(e, false);
    });
    
    // Reset modifiers when window loses focus
    window.addEventListener('blur', () => {
      this.resetModifierKeys();
    });
  }

  /**
   * Update modifier keys state
   * @param {KeyboardEvent} e - Keyboard event
   * @param {boolean} pressed - Whether key is pressed
   */
  updateModifierKeys(e, pressed) {
    switch (e.key) {
      case 'Control':
        this.modifierKeys.ctrl = pressed;
        break;
      case 'Alt':
        this.modifierKeys.alt = pressed;
        break;
      case 'Shift':
        this.modifierKeys.shift = pressed;
        break;
      case 'Meta':
        this.modifierKeys.meta = pressed;
        break;
    }
  }

  /**
   * Reset all modifier keys
   */
  resetModifierKeys() {
    this.modifierKeys = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    };
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    if (!this.enabled) return;
    
    // Ignore if target is input, textarea, or contenteditable
    if (this.shouldIgnoreEvent(e)) return;
    
    const key = this.getKeyString(e);
    const shortcut = this.shortcuts.get(key);
    
    if (shortcut) {
      e.preventDefault();
      e.stopPropagation();
      
      this.notifyListeners(shortcut.action, {
        key,
        action: shortcut.action,
        description: shortcut.description,
        event: e
      });
    }
  }

  /**
   * Handle keyup events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyUp(e) {
    // Update modifier keys
    this.updateModifierKeys(e, false);
  }

  /**
   * Handle focus in events
   * @param {FocusEvent} e - Focus event
   */
  handleFocusIn(e) {
    // Store focused element for context
    this.focusedElement = e.target;
  }

  /**
   * Handle focus out events
   * @param {FocusEvent} e - Focus event
   */
  handleFocusOut(e) {
    this.focusedElement = null;
  }

  /**
   * Prevent browser shortcuts that conflict with our shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  preventBrowserShortcuts(e) {
    if (!this.enabled) return;
    
    const key = this.getKeyString(e);
    const conflictingShortcuts = [
      'ctrl+s', // Save in browser
      'ctrl+k', // Search in browser
      'ctrl+f', // Find in browser
      'ctrl+/', // Might trigger browser help
      'meta+s', // Save in browser (Mac)
      'meta+k', // Search in browser (Mac)
      'meta+f', // Find in browser (Mac)
      'meta+/'  // Might trigger browser help (Mac)
    ];
    
    if (conflictingShortcuts.includes(key)) {
      const target = e.target;
      const isInputElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable;
      
      if (!isInputElement) {
        e.preventDefault();
      }
    }
  }

  /**
   * Check if event should be ignored
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {boolean} Whether to ignore the event
   */
  shouldIgnoreEvent(e) {
    const target = e.target;
    
    // Ignore if target is input, textarea, or contenteditable
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable) {
      
      // Allow some shortcuts even in inputs
      const key = this.getKeyString(e);
      const allowedInInputs = [
        'escape',
        'ctrl+enter',
        'meta+enter'
      ];
      
      return !allowedInInputs.includes(key);
    }
    
    // Ignore if modal or settings panel is open
    const settingsPanel = document.getElementById('settings-panel');
    const fileDropOverlay = document.getElementById('file-drop-overlay');
    
    if (settingsPanel && settingsPanel.classList.contains('open')) {
      const key = this.getKeyString(e);
      return key !== 'escape'; // Only allow escape in settings
    }
    
    if (fileDropOverlay && fileDropOverlay.style.display !== 'none') {
      const key = this.getKeyString(e);
      return key !== 'escape'; // Only allow escape in file overlay
    }
    
    return false;
  }

  /**
   * Get normalized key string from keyboard event
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {string} Normalized key string
   */
  getKeyString(e) {
    const parts = [];
    
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (e.metaKey) parts.push('meta');
    
    // Normalize key name
    let key = e.key.toLowerCase();
    
    // Handle special keys
    const specialKeys = {
      ' ': 'space',
      'arrowup': 'up',
      'arrowdown': 'down',
      'arrowleft': 'left',
      'arrowright': 'right',
      'escape': 'escape'
    };
    
    if (specialKeys[key]) {
      key = specialKeys[key];
    }
    
    parts.push(key);
    
    return parts.join('+');
  }

  /**
   * Add a keyboard shortcut
   * @param {string} key - Key combination (e.g., 'ctrl+enter')
   * @param {string} action - Action identifier
   * @param {string} description - Human-readable description
   */
  addShortcut(key, action, description = '') {
    this.shortcuts.set(key.toLowerCase(), {
      action,
      description,
      key: key.toLowerCase()
    });
  }

  /**
   * Remove a keyboard shortcut
   * @param {string} key - Key combination to remove
   */
  removeShortcut(key) {
    this.shortcuts.delete(key.toLowerCase());
  }

  /**
   * Get all shortcuts
   * @returns {Array} Array of shortcut objects
   */
  getAllShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([key, shortcut]) => ({
      key,
      ...shortcut
    }));
  }

  /**
   * Get shortcuts for a specific action
   * @param {string} action - Action identifier
   * @returns {Array} Array of shortcuts for the action
   */
  getShortcutsForAction(action) {
    return this.getAllShortcuts().filter(shortcut => shortcut.action === action);
  }

  /**
   * Check if user is on Mac
   * @returns {boolean} Whether user is on Mac
   */
  isMac() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
           navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  }

  /**
   * Get platform-specific modifier key name
   * @returns {string} 'Ctrl' for Windows/Linux, 'Cmd' for Mac
   */
  getPlatformModifier() {
    return this.isMac() ? 'Cmd' : 'Ctrl';
  }

  /**
   * Get display text for shortcut key
   * @param {string} key - Key combination
   * @returns {string} Display-friendly text
   */
  getDisplayText(key) {
    return key
      .toLowerCase()
      .replace('ctrl', this.isMac() ? '⌘' : 'Ctrl')
      .replace('meta', '⌘')
      .replace('alt', 'Alt')
      .replace('shift', 'Shift')
      .replace('enter', 'Enter')
      .replace('escape', 'Esc')
      .replace('space', 'Space')
      .replace('up', '↑')
      .replace('down', '↓')
      .replace('left', '←')
      .replace('right', '→')
      .split('+')
      .join(' + ');
  }

  /**
   * Enable or disable keyboard shortcuts
   * @param {boolean} enabled - Whether shortcuts should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Check if shortcuts are enabled
   * @returns {boolean} Whether shortcuts are enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Show keyboard shortcuts help
   */
  showHelp() {
    const shortcuts = this.getAllShortcuts();
    const helpContent = this.generateHelpContent(shortcuts);
    
    this.notifyListeners('showHelp', {
      shortcuts,
      content: helpContent
    });
  }

  /**
   * Generate help content for shortcuts
   * @param {Array} shortcuts - Array of shortcuts
   * @returns {string} HTML content for help
   */
  generateHelpContent(shortcuts) {
    const groups = this.groupShortcutsByAction(shortcuts);
    let html = '<div class="keyboard-help">';
    
    Object.keys(groups).forEach(group => {
      html += `<h3>${group}</h3><ul>`;
      
      groups[group].forEach(shortcut => {
        html += `<li>
          <kbd>${this.getDisplayText(shortcut.key)}</kbd>
          <span>${shortcut.description}</span>
        </li>`;
      });
      
      html += '</ul>';
    });
    
    html += '</div>';
    return html;
  }

  /**
   * Group shortcuts by action category
   * @param {Array} shortcuts - Array of shortcuts
   * @returns {Object} Grouped shortcuts
   */
  groupShortcutsByAction(shortcuts) {
    const groups = {
      'JSON Operations': [],
      'File Operations': [],
      'UI Operations': [],
      'Navigation': [],
      'Other': []
    };
    
    shortcuts.forEach(shortcut => {
      let category = 'Other';
      
      if (['validate', 'format', 'minify', 'clear'].includes(shortcut.action)) {
        category = 'JSON Operations';
      } else if (['open', 'save', 'copy'].includes(shortcut.action)) {
        category = 'File Operations';
      } else if (['settings', 'theme', 'escape'].includes(shortcut.action)) {
        category = 'UI Operations';
      } else if (['help'].includes(shortcut.action)) {
        category = 'Navigation';
      }
      
      groups[category].push(shortcut);
    });
    
    // Remove empty categories
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Notify listeners of an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in keyboard shortcut listener:', error);
        }
      });
    }
  }
}