/**
 * Settings Manager Module
 * Handles application settings, preferences, and localStorage
 */

export class SettingsManager {
  constructor() {
    this.defaultSettings = {
      // Editor settings
      indentation: '2',
      showLineNumbers: true,
      wordWrap: true,
      fontSize: 14,
      
      // Theme settings
      theme: 'light',
      autoTheme: false,
      
      // Validation settings
      realTimeValidation: false,
      validationDelay: 300,
      showWarnings: true,
      
      // Behavior settings
      autoFormat: false,
      autoSortKeys: false,
      trimWhitespace: true,
      
      // File settings
      maxFileSize: 10, // MB
      rememberLastFile: false,
      
      // UI settings
      compactMode: false,
      showStats: true,
      animationsEnabled: true
    };
    
    this.settings = { ...this.defaultSettings };
    this.listeners = new Map();
    this.init();
  }

  /**
   * Initialize settings manager
   */
  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.applySettings();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('jsonValidatorSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.settings = { ...this.defaultSettings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      this.settings = { ...this.defaultSettings };
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('jsonValidatorSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }

  /**
   * Get a setting value
   * @param {string} key - Setting key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Setting value
   */
  get(key, defaultValue = null) {
    return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
  }

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {*} value - New value
   */
  set(key, value) {
    const oldValue = this.settings[key];
    this.settings[key] = value;
    
    // Save to localStorage
    this.saveSettings();
    
    // Notify listeners
    this.notifyListeners(key, value, oldValue);
    
    // Apply setting if needed
    this.applySetting(key, value);
  }

  /**
   * Update multiple settings at once
   * @param {Object} updates - Object with setting updates
   */
  update(updates) {
    const oldValues = { ...this.settings };
    
    Object.keys(updates).forEach(key => {
      this.settings[key] = updates[key];
    });
    
    // Save to localStorage
    this.saveSettings();
    
    // Notify listeners
    Object.keys(updates).forEach(key => {
      this.notifyListeners(key, updates[key], oldValues[key]);
      this.applySetting(key, updates[key]);
    });
  }

  /**
   * Reset all settings to defaults
   */
  reset() {
    const oldValues = { ...this.settings };
    this.settings = { ...this.defaultSettings };
    
    // Save to localStorage
    this.saveSettings();
    
    // Notify listeners
    Object.keys(this.settings).forEach(key => {
      this.notifyListeners(key, this.settings[key], oldValues[key]);
      this.applySetting(key, this.settings[key]);
    });
  }

  /**
   * Reset a specific setting to default
   * @param {string} key - Setting key to reset
   */
  resetSetting(key) {
    if (this.defaultSettings[key] !== undefined) {
      const oldValue = this.settings[key];
      this.settings[key] = this.defaultSettings[key];
      
      // Save to localStorage
      this.saveSettings();
      
      // Notify listeners
      this.notifyListeners(key, this.settings[key], oldValue);
      
      // Apply setting
      this.applySetting(key, this.settings[key]);
    }
  }

  /**
   * Add a listener for setting changes
   * @param {string} key - Setting key to listen for (or '*' for all)
   * @param {Function} callback - Callback function
   */
  addListener(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
  }

  /**
   * Remove a listener
   * @param {string} key - Setting key
   * @param {Function} callback - Callback function to remove
   */
  removeListener(key, callback) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).delete(callback);
    }
  }

  /**
   * Notify listeners of setting changes
   * @param {string} key - Changed setting key
   * @param {*} newValue - New value
   * @param {*} oldValue - Previous value
   */
  notifyListeners(key, newValue, oldValue) {
    // Notify specific key listeners
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error('Error in settings listener:', error);
        }
      });
    }
    
    // Notify global listeners
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error('Error in settings listener:', error);
        }
      });
    }
  }

  /**
   * Apply a setting to the UI
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  applySetting(key, value) {
    switch (key) {
      case 'theme':
        this.applyTheme(value);
        break;
      case 'fontSize':
        this.applyFontSize(value);
        break;
      case 'indentation':
        this.applyIndentation(value);
        break;
      case 'showLineNumbers':
        this.applyLineNumbers(value);
        break;
      case 'wordWrap':
        this.applyWordWrap(value);
        break;
      case 'compactMode':
        this.applyCompactMode(value);
        break;
    }
  }

  /**
   * Apply all settings to the UI
   */
  applySettings() {
    Object.keys(this.settings).forEach(key => {
      this.applySetting(key, this.settings[key]);
    });
  }

  /**
   * Apply theme setting
   * @param {string} theme - Theme name
   */
  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    
    // Update theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      const lightIcon = themeToggle.querySelector('.theme-icon-light');
      const darkIcon = themeToggle.querySelector('.theme-icon-dark');
      
      if (theme === 'dark') {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'block';
      } else {
        lightIcon.style.display = 'block';
        darkIcon.style.display = 'none';
      }
    }
  }

  /**
   * Apply font size setting
   * @param {number} fontSize - Font size in pixels
   */
  applyFontSize(fontSize) {
    const editor = document.querySelector('.json-editor');
    const output = document.querySelector('.json-output');
    
    if (editor) {
      editor.style.fontSize = fontSize + 'px';
    }
    if (output) {
      output.style.fontSize = fontSize + 'px';
    }
  }

  /**
   * Apply indentation setting
   * @param {string|number} indentation - Indentation setting
   */
  applyIndentation(indentation) {
    const select = document.getElementById('indentation');
    if (select) {
      select.value = indentation;
    }
  }

  /**
   * Apply line numbers setting
   * @param {boolean} show - Whether to show line numbers
   */
  applyLineNumbers(show) {
    const checkbox = document.getElementById('show-line-numbers');
    if (checkbox) {
      checkbox.checked = show;
    }
    
    // This would be applied to CodeMirror when initialized
    if (window.editor && window.editor.dispatch) {
      // CodeMirror line numbers configuration
    }
  }

  /**
   * Apply word wrap setting
   * @param {boolean} wrap - Whether to enable word wrap
   */
  applyWordWrap(wrap) {
    const editor = document.querySelector('.json-editor');
    const output = document.querySelector('.json-output');
    
    if (editor) {
      editor.style.whiteSpace = wrap ? 'pre-wrap' : 'pre';
    }
    if (output) {
      output.style.whiteSpace = wrap ? 'pre-wrap' : 'pre';
    }
  }

  /**
   * Apply compact mode setting
   * @param {boolean} compact - Whether to enable compact mode
   */
  applyCompactMode(compact) {
    document.body.classList.toggle('compact-mode', compact);
  }

  /**
   * Setup event listeners for settings controls
   */
  setupEventListeners() {
    // Indentation setting
    const indentationSelect = document.getElementById('indentation');
    if (indentationSelect) {
      indentationSelect.addEventListener('change', (e) => {
        this.set('indentation', e.target.value);
      });
    }
    
    // Real-time validation
    const realTimeValidation = document.getElementById('real-time-validation');
    if (realTimeValidation) {
      realTimeValidation.addEventListener('change', (e) => {
        this.set('realTimeValidation', e.target.checked);
      });
    }
    
    // Auto-format
    const autoFormat = document.getElementById('auto-format');
    if (autoFormat) {
      autoFormat.addEventListener('change', (e) => {
        this.set('autoFormat', e.target.checked);
      });
    }
    
    // Show line numbers
    const showLineNumbers = document.getElementById('show-line-numbers');
    if (showLineNumbers) {
      showLineNumbers.addEventListener('change', (e) => {
        this.set('showLineNumbers', e.target.checked);
      });
    }
  }

  /**
   * Export settings to JSON
   * @returns {string} Settings as JSON string
   */
  exportSettings() {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON
   * @param {string} settingsJson - Settings as JSON string
   * @returns {boolean} Whether import was successful
   */
  importSettings(settingsJson) {
    try {
      const imported = JSON.parse(settingsJson);
      const validSettings = { ...this.defaultSettings };
      
      // Only import valid settings
      Object.keys(this.defaultSettings).forEach(key => {
        if (imported[key] !== undefined) {
          validSettings[key] = imported[key];
        }
      });
      
      this.settings = validSettings;
      this.saveSettings();
      this.applySettings();
      
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  /**
   * Get settings summary for display
   * @returns {Object} Settings summary
   */
  getSettingsSummary() {
    return {
      theme: this.get('theme'),
      indentation: this.get('indentation'),
      realTimeValidation: this.get('realTimeValidation'),
      autoFormat: this.get('autoFormat'),
      showLineNumbers: this.get('showLineNumbers'),
      compactMode: this.get('compactMode')
    };
  }

  /**
   * Validate settings value
   * @param {string} key - Setting key
   * @param {*} value - Value to validate
   * @returns {boolean} Whether value is valid
   */
  validateSetting(key, value) {
    switch (key) {
      case 'theme':
        return ['light', 'dark'].includes(value);
      case 'indentation':
        return ['2', '4', 'tab'].includes(value);
      case 'fontSize':
        return typeof value === 'number' && value >= 10 && value <= 24;
      case 'validationDelay':
        return typeof value === 'number' && value >= 100 && value <= 2000;
      case 'maxFileSize':
        return typeof value === 'number' && value >= 1 && value <= 50;
      default:
        return true;
    }
  }

  /**
   * Get all settings as a plain object
   * @returns {Object} All settings
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * Check if a setting exists
   * @param {string} key - Setting key
   * @returns {boolean} Whether setting exists
   */
  has(key) {
    return this.settings.hasOwnProperty(key);
  }

  /**
   * Delete a setting (reset to default)
   * @param {string} key - Setting key to delete
   */
  delete(key) {
    if (this.defaultSettings[key] !== undefined) {
      this.resetSetting(key);
    }
  }

  /**
   * Clear all settings (reset to defaults)
   */
  clear() {
    this.reset();
  }
}