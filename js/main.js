/**
 * JSON Validator & Formatter - Main Application
 * Coordinates all modules and handles application initialization
 */

import { JSONValidator } from './validator.js';
import { JSONFormatter } from './formatter.js';
import { UIController } from './ui.js';
import { SettingsManager } from './settings.js';
import { FileHandler } from './fileHandler.js';
import { URLHandler } from './urlHandler.js';
import { KeyboardShortcuts } from './keyboard.js';

class JSONValidatorApp {
  constructor() {
    this.state = {
      mode: 'input',
      jsonInput: '',
      jsonOutput: '',
      validationResult: null,
      lastValidationTime: 0,
      debounceTimer: null
    };
    
    // Initialize modules
    this.validator = new JSONValidator();
    this.formatter = new JSONFormatter();
    this.ui = new UIController();
    this.settings = new SettingsManager();
    this.fileHandler = new FileHandler();
    this.urlHandler = new URLHandler();
    this.keyboard = new KeyboardShortcuts();

    
    // Sample JSON data - array of different samples
    this.sampleJSONs = [
      {
        name: "John Doe",
        age: 30,
        city: "New York",
        hobbies: ["reading", "swimming", "coding"],
        address: {
          street: "123 Main St",
          zipCode: "10001"
        },
        isActive: true,
        balance: null
      },
      {
        products: [
          { id: 1, name: "Widget", price: 19.99, category: "tools" },
          { id: 2, name: "Gadget", price: 29.99, category: "electronics" },
          { id: 3, name: "Book", price: 12.99, category: "books" }
        ],
        total: 62.97,
        currency: "USD"
      },
      {
        user: {
          profile: {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com"
          },
          settings: {
            theme: "dark",
            notifications: true,
            language: "en"
          },
          preferences: {
            categories: ["technology", "science", "art"],
            maxItems: 50
          }
        },
        lastLogin: "2024-11-01T10:30:00Z"
      },
      {
        api: {
          version: "1.0",
          endpoints: [
            { path: "/users", method: "GET", auth: true },
            { path: "/posts", method: "POST", auth: true },
            { path: "/comments", method: "GET", auth: false }
          ],
          rateLimit: {
            requests: 100,
            period: "hour"
          }
        },
        status: "active"
      },
      {
        config: {
          database: {
            host: "localhost",
            port: 5432,
            name: "myapp",
            credentials: {
              username: "admin",
              password: "secret"
            }
          },
          features: {
            logging: true,
            caching: false,
            analytics: true
          },
          environment: "development"
        }
      }
    ];
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }

      // Setup mobile menu
      this.setupMobileMenu();

      // Setup event listeners
      this.setupEventListeners();
      this.setupModuleListeners();

      // Apply saved settings
      this.applySettings();

      // Load initial data
      await this.loadInitialData();

      // Initialize CodeMirror if available
      await this.initializeCodeMirror();

      // Update UI
      this.updateInfoPanel();
      this.ui.clearStatus();

      console.log('JSON Validator & Formatter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.ui.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Setup mobile menu functionality
   */
  setupMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuToggle && mainNav) {
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
          mainNav.classList.remove('open');
          mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
      });

      // Close menu when clicking on a link
      mainNav.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          mainNav.classList.remove('open');
          mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /**
   * Setup event listeners for UI elements
   */
  setupEventListeners() {
    // Action buttons
    document.getElementById('validate-btn').addEventListener('click', () => this.validateJSON());
    document.getElementById('format-btn').addEventListener('click', () => this.formatJSON());
    document.getElementById('minify-btn').addEventListener('click', () => this.minifyJSON());
    document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());
    document.getElementById('copy-btn').addEventListener('click', () => this.copyToClipboard());
    document.getElementById('sample-btn').addEventListener('click', () => this.loadSampleJSON());
    
    // Settings panel
    document.getElementById('settings-toggle').addEventListener('click', () => this.ui.toggleSettings());
    document.getElementById('settings-close').addEventListener('click', () => this.ui.closeSettings());
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
    
    // Real-time validation
    this.setupRealTimeValidation();
  }

  /**
   * Setup listeners for module events
   */
  setupModuleListeners() {
    // File handler events
    this.fileHandler.addListener('fileProcessed', (data) => {
      this.state.jsonInput = data.content;
      this.setEditorContent(data.content);
      this.ui.showSuccess(`Loaded ${data.file.name}`);
    });
    
    this.fileHandler.addListener('fileError', (data) => {
      this.ui.showError(`Failed to load file: ${data.error.message}`);
    });
    
    // URL handler events
    this.urlHandler.addListener('inputLoaded', (data) => {
      this.state.jsonInput = data.content;
      this.setEditorContent(data.content);
      this.ui.showSuccess('Loaded JSON from URL parameter');
    });
    
    this.urlHandler.addListener('urlLoaded', (data) => {
      this.state.jsonInput = data.content;
      this.setEditorContent(data.content);
      this.ui.showSuccess(`Loaded JSON from ${data.url}`);
    });
    
    this.urlHandler.addListener('urlError', (data) => {
      this.ui.showError(`Failed to load URL: ${data.error.message}`);
    });
    
    this.urlHandler.addListener('themeChanged', (data) => {
      this.settings.set('theme', data.theme);
    });
    
    this.urlHandler.addListener('exampleLoaded', (data) => {
      this.state.jsonInput = data.content;
      this.setEditorContent(data.content);
      this.ui.showSuccess(`Loaded example: ${data.name}`);
    });
    
    // Keyboard shortcuts
    this.keyboard.addListener('validate', () => this.validateJSON());
    this.keyboard.addListener('format', () => this.formatJSON());
    this.keyboard.addListener('minify', () => this.minifyJSON());
    this.keyboard.addListener('clear', () => this.clearAll());
    this.keyboard.addListener('copy', () => this.copyToClipboard());
    this.keyboard.addListener('open', () => this.openFile());
    this.keyboard.addListener('save', () => this.saveFile());
    this.keyboard.addListener('settings', () => this.ui.toggleSettings());
    this.keyboard.addListener('theme', () => this.toggleTheme());
    this.keyboard.addListener('escape', () => this.handleEscape());
    this.keyboard.addListener('help', () => this.showKeyboardHelp());
    
    // Settings changes
    this.settings.addListener('realTimeValidation', (enabled) => {
      this.setupRealTimeValidation();
    });
    
    this.settings.addListener('theme', (theme) => {
      this.ui.applyTheme(theme);
    });
    
    this.settings.addListener('indentation', (indentation) => {
      // Indentation will be used on next format operation
    });
  }

  /**
   * Initialize CodeMirror editor
   */
  async initializeCodeMirror() {
    // Check if CodeMirror is available
    if (typeof window.CodeMirror === 'undefined') {
      console.warn('CodeMirror not available, using fallback textarea');
      this.setupFallbackEditor();
      return;
    }
    
    try {
      const editorElement = document.getElementById('json-input');
      
      // Initialize CodeMirror
      const editor = new CodeMirror({
        parent: editorElement,
        extensions: [
          window.json(),
          window.EditorView.theme({
            '&': { 
              height: '100%',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size, 14px)'
            },
            '.cm-scroller': { 
              overflow: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size, 14px)'
            },
            '.cm-content': { 
              padding: '1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size, 14px)'
            },
            '.cm-gutter': {
              backgroundColor: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border-color)'
            },
            '.cm-lineNumbers .cm-gutterElement': {
              color: 'var(--text-muted)',
              padding: '0 8px'
            }
          })
        ]
      });
      
      // Store editor reference globally
      window.editor = editor;
      
      // Setup editor events
      editor.on('change', () => {
        this.state.jsonInput = editor.state.doc.toString();
        this.updateInfoPanel();
        
        if (this.settings.get('realTimeValidation')) {
          this.debounceValidation();
        }
      });
      
      // Apply settings to editor
      this.applyEditorSettings();
      
    } catch (error) {
      console.error('Failed to initialize CodeMirror:', error);
      this.setupFallbackEditor();
    }
  }

  /**
   * Setup fallback textarea editor
   */
  setupFallbackEditor() {
    const textarea = document.getElementById('json-input');
    
    textarea.addEventListener('input', () => {
      this.state.jsonInput = textarea.value;
      this.updateInfoPanel();
      
      if (this.settings.get('realTimeValidation')) {
        this.debounceValidation();
      }
    });
  }

  /**
   * Apply editor settings
   */
  applyEditorSettings() {
    if (!window.editor) return;
    
    // Apply line numbers setting
    const showLineNumbers = this.settings.get('showLineNumbers');
    // This would need to be implemented with CodeMirror's configuration
    
    // Apply font size
    const fontSize = this.settings.get('fontSize');
    document.documentElement.style.setProperty('--font-size', fontSize + 'px');
  }

  /**
   * Setup real-time validation with debouncing
   */
  setupRealTimeValidation() {
    if (this.state.debounceTimer) {
      clearTimeout(this.state.debounceTimer);
    }
    
    const enabled = this.settings.get('realTimeValidation');
    const delay = this.settings.get('validationDelay');
    
    if (enabled) {
      const validateHandler = () => {
        if (this.state.debounceTimer) {
          clearTimeout(this.state.debounceTimer);
        }
        
        this.state.debounceTimer = setTimeout(() => {
          this.validateJSON(true); // Silent validation
        }, delay);
      };
      
      if (window.editor) {
        window.editor.on('change', validateHandler);
      } else {
        document.getElementById('json-input').addEventListener('input', validateHandler);
      }
    }
  }

  /**
   * Validate JSON
   * @param {boolean} silent - Whether to show notifications
   */
  async validateJSON(silent = false) {
    const startTime = performance.now();

    try {
      this.state.validationResult = this.validator.validate(this.state.jsonInput);
      const endTime = performance.now();
      const parseTime = endTime - startTime;

      if (this.state.validationResult.isValid) {
        this.state.jsonOutput = this.state.validationResult.formatted;
        this.ui.setOutputContent(this.state.jsonOutput);
        this.ui.switchMode('output');

        if (!silent) {
          this.ui.showSuccess('✓ Valid JSON');
        }

        this.ui.updateStatusBar({
          type: 'valid',
          text: '✓ Valid JSON',
          size: new Blob([this.state.jsonInput]).size,
          parseTime
        });

      } else {
        if (!silent) {
          this.ui.showError(this.state.validationResult.error);
        }

        this.ui.switchMode('input');
        this.ui.highlightError(
          this.state.validationResult.line,
          this.state.validationResult.column
        );

        this.ui.updateStatusBar({
          type: 'invalid',
          text: '✗ Invalid JSON',
          size: new Blob([this.state.jsonInput]).size,
          parseTime
        });
      }

      this.state.lastValidationTime = parseTime;
    } catch (error) {
      this.ui.showError('Validation error: ' + error.message);
    }
  }


  /**
   * Format/Beautify JSON
   */
  formatJSON() {
    try {
      const indentation = this.settings.get('indentation');
      this.state.jsonOutput = this.formatter.beautify(this.state.jsonInput, indentation);
      this.ui.setOutputContent(this.state.jsonOutput);
      this.ui.switchMode('output');
      this.ui.showSuccess('JSON formatted successfully');
      
      // Update validation result
      this.state.validationResult = this.validator.validate(this.state.jsonInput);
      if (this.state.validationResult.isValid) {
        this.ui.updateStatusBar({
          type: 'valid',
          text: '✓ Valid JSON',
          size: new Blob([this.state.jsonInput]).size
        });
      }
    } catch (error) {
      this.ui.showError('Invalid JSON: ' + error.message);
    }
  }

  /**
   * Minify JSON
   */
  minifyJSON() {
    try {
      this.state.jsonOutput = this.formatter.minify(this.state.jsonInput);
      this.ui.setOutputContent(this.state.jsonOutput);
      this.ui.switchMode('output');
      this.ui.showSuccess('JSON minified successfully');
      
      // Update validation result
      this.state.validationResult = this.validator.validate(this.state.jsonInput);
      if (this.state.validationResult.isValid) {
        this.ui.updateStatusBar({
          type: 'valid',
          text: '✓ Valid JSON',
          size: new Blob([this.state.jsonInput]).size
        });
      }
    } catch (error) {
      this.ui.showError('Invalid JSON: ' + error.message);
    }
  }

  /**
   * Clear all content
   */
  clearAll() {
    this.state.jsonInput = '';
    this.state.jsonOutput = '';
    this.state.validationResult = null;
    
    this.setEditorContent('');
    this.ui.setOutputContent('');
    this.ui.switchMode('input');
    this.ui.clearStatus();
    this.updateInfoPanel();
    
    this.ui.showSuccess('Cleared all content');
  }

  /**
   * Copy to clipboard
   */
  async copyToClipboard() {
    const textToCopy = this.state.mode === 'output' && this.state.jsonOutput ? 
                      this.state.jsonOutput : 
                      this.state.jsonInput;
    
    if (!textToCopy) {
      this.ui.showWarning('Nothing to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      this.ui.showSuccess('Copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        this.ui.showSuccess('Copied to clipboard');
      } catch (fallbackError) {
        this.ui.showError('Failed to copy to clipboard');
      }
    }
  }

  /**
   * Load sample JSON
   */
  loadSampleJSON() {
    const randomIndex = Math.floor(Math.random() * this.sampleJSONs.length);
    const selectedSample = this.sampleJSONs[randomIndex];
    const jsonString = JSON.stringify(selectedSample, null, 2);
    this.state.jsonInput = jsonString;
    this.setEditorContent(jsonString);
    this.updateInfoPanel();
    this.ui.showSuccess('Loaded sample JSON');
  }

  /**
   * Open file
   */
  async openFile() {
    try {
      const files = await this.fileHandler.showFilePicker();
      if (files.length > 0) {
        await this.fileHandler.processFiles(files);
      }
    } catch (error) {
      this.ui.showError('Failed to open file: ' + error.message);
    }
  }

  /**
   * Save file
   */
  saveFile() {
    const content = this.state.mode === 'output' && this.state.jsonOutput ? 
                   this.state.jsonOutput : 
                   this.state.jsonInput;
    
    if (!content) {
      this.ui.showWarning('Nothing to save');
      return;
    }
    
    const filename = 'formatted-json.json';
    this.fileHandler.downloadJSON(content, filename, true);
    this.ui.showSuccess('File downloaded');
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    const currentTheme = this.settings.get('theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.settings.set('theme', newTheme);
  }

  /**
   * Handle escape key
   */
  handleEscape() {
    // Close settings if open
    this.ui.closeSettings();
    
    // Hide file drop overlay if visible
    this.fileHandler.hideDropOverlay();
    
    // Switch back to input mode if in output mode
    if (this.state.mode === 'output') {
      this.ui.switchMode('input');
    }
  }

  /**
   * Show keyboard help
   */
  showKeyboardHelp() {
    const shortcuts = this.keyboard.getAllShortcuts();
    const helpContent = this.keyboard.generateHelpContent(shortcuts);
    
    // Create help modal
    const modal = document.createElement('div');
    modal.className = 'help-modal';
    modal.innerHTML = `
      <div class="help-modal-content">
        <div class="help-modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button class="help-modal-close">&times;</button>
        </div>
        <div class="help-modal-body">
          ${helpContent}
        </div>
      </div>
    `;
    
    // Add styles
    Object.assign(modal.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: '3000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });
    
    const content = modal.querySelector('.help-modal-content');
    Object.assign(content.style, {
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '8px',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflow: 'auto',
      padding: '0',
      boxShadow: 'var(--shadow-lg)'
    });
    
    // Add to DOM and handle close
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.help-modal-close');
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Focus close button for accessibility
    closeBtn.focus();
  }

  /**
   * Debounce validation
   */
  debounceValidation() {
    if (this.state.debounceTimer) {
      clearTimeout(this.state.debounceTimer);
    }
    
    const delay = this.settings.get('validationDelay');
    this.state.debounceTimer = setTimeout(() => {
      this.validateJSON(true); // Silent validation
    }, delay);
  }

  /**
   * Apply saved settings
   */
  applySettings() {
    this.ui.applySavedTheme();
    this.applyEditorSettings();
    this.setupRealTimeValidation();
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    // URL parameters take priority over saved content
    const params = this.urlHandler.getCurrentParameters();
    if (Object.keys(params).length > 0) {
      return; // URL handler already processed the parameters
    }
    
    // Try to load saved content from localStorage
    const savedContent = this.fileHandler.loadFromStorage();
    if (savedContent) {
      this.state.jsonInput = savedContent;
      this.setEditorContent(savedContent);
    }
  }

  /**
   * Update info panel
   */
  updateInfoPanel() {
    this.ui.updateInfoPanel(this.state.jsonInput);
  }

  /**
   * Set editor content
   * @param {string} content - Content to set
   */
  setEditorContent(content) {
    this.ui.setEditorContent(content);
    this.updateInfoPanel();
    
    // Save to localStorage
    if (this.settings.get('rememberLastFile')) {
      this.fileHandler.saveToStorage(content);
    }
  }
}

// Initialize the application
const app = new JSONValidatorApp();

// Make app available globally for debugging
window.jsonValidatorApp = app;

// Global function for mobile menu toggle (for onclick attribute)
window.toggleMobileMenu = function() {
  const mainNav = document.querySelector('.main-nav');
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');

  if (mainNav) {
    mainNav.classList.toggle('open');
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.setAttribute('aria-expanded',
      mainNav ? mainNav.classList.contains('open').toString() : 'false');
  }
};