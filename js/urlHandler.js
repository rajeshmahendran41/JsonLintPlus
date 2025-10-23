/**
 * URL Handler Module
 * Manages URL parameters and loading JSON from URLs
 */

export class URLHandler {
  constructor() {
    this.listeners = new Map();
    this.currentURL = new URL(window.location);
    this.init();
  }

  /**
   * Initialize URL handler
   */
  init() {
    this.parseURLParameters();
    this.setupHistoryHandling();
  }

  /**
   * Parse URL parameters and handle them
   */
  parseURLParameters() {
    const params = this.currentURL.searchParams;
    
    // Handle JSON input parameter
    if (params.has('input')) {
      this.handleInputParameter(params.get('input'));
    }
    
    // Handle JSON URL parameter
    if (params.has('url')) {
      this.handleURLParameter(params.get('url'));
    }
    
    // Handle theme parameter
    if (params.has('theme')) {
      this.handleThemeParameter(params.get('theme'));
    }
    
    // Handle settings parameter
    if (params.has('settings')) {
      this.handleSettingsParameter(params.get('settings'));
    }
    
    // Handle example parameter
    if (params.has('example')) {
      this.handleExampleParameter(params.get('example'));
    }
  }

  /**
   * Handle input parameter (direct JSON input)
   * @param {string} input - Base64 encoded JSON or direct JSON
   */
  handleInputParameter(input) {
    try {
      let jsonContent;
      
      // Try to decode as base64 first
      try {
        jsonContent = atob(input);
      } catch (e) {
        // If not base64, use as-is
        jsonContent = input;
      }
      
      // Validate that it's valid JSON
      JSON.parse(jsonContent);
      
      this.notifyListeners('inputLoaded', { 
        content: jsonContent, 
        source: 'url-parameter' 
      });
    } catch (error) {
      this.notifyListeners('inputError', { 
        error: 'Invalid JSON in URL parameter', 
        input 
      });
    }
  }

  /**
   * Handle URL parameter (load JSON from URL)
   * @param {string} url - URL to load JSON from
   */
  async handleURLParameter(url) {
    try {
      this.notifyListeners('urlLoading', { url });
      
      // Validate URL
      const validURL = this.validateURL(url);
      if (!validURL) {
        throw new Error('Invalid URL provided');
      }
      
      // Fetch JSON from URL
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType.includes('json') && !contentType.includes('text')) {
        throw new Error('URL does not point to JSON content');
      }
      
      const jsonContent = await response.text();
      
      // Validate JSON
      JSON.parse(jsonContent);
      
      this.notifyListeners('urlLoaded', { 
        url, 
        content: jsonContent,
        contentType,
        size: jsonContent.length
      });
    } catch (error) {
      this.notifyListeners('urlError', { url, error });
    }
  }

  /**
   * Handle theme parameter
   * @param {string} theme - Theme name
   */
  handleThemeParameter(theme) {
    if (['light', 'dark'].includes(theme)) {
      this.notifyListeners('themeChanged', { theme, source: 'url' });
    }
  }

  /**
   * Handle settings parameter
   * @param {string} settings - Base64 encoded settings JSON
   */
  handleSettingsParameter(settings) {
    try {
      const settingsJSON = atob(settings);
      const settingsObj = JSON.parse(settingsJSON);
      
      this.notifyListeners('settingsLoaded', { 
        settings: settingsObj, 
        source: 'url-parameter' 
      });
    } catch (error) {
      this.notifyListeners('settingsError', { 
        error: 'Invalid settings in URL parameter', 
        settings 
      });
    }
  }

  /**
   * Handle example parameter
   * @param {string} example - Example name
   */
  handleExampleParameter(example) {
    const examples = this.getAvailableExamples();
    
    if (examples[example]) {
      this.notifyListeners('exampleLoaded', { 
        name: example,
        content: examples[example],
        source: 'url-parameter'
      });
    } else {
      this.notifyListeners('exampleError', { 
        error: 'Unknown example: ' + example,
        availableExamples: Object.keys(examples)
      });
    }
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean} Whether URL is valid
   */
  validateURL(url) {
    try {
      // Check if it's a valid URL
      new URL(url);
      
      // Check protocol
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available JSON examples
   * @returns {Object} Available examples
   */
  getAvailableExamples() {
    return {
      simple: {
        name: 'Simple Object',
        description: 'A simple JSON object with basic data types',
        content: JSON.stringify({
          "name": "John Doe",
          "age": 30,
          "city": "New York",
          "isActive": true,
          "balance": null
        }, null, 2)
      },
      
      complex: {
        name: 'Complex Object',
        description: 'A complex JSON with nested objects and arrays',
        content: JSON.stringify({
          "user": {
            "id": 123,
            "profile": {
              "name": "Jane Smith",
              "email": "jane@example.com",
              "preferences": {
                "theme": "dark",
                "notifications": ["email", "push"],
                "privacy": {
                  "public": false,
                  "dataSharing": true
                }
              }
            },
            "activity": [
              {
                "type": "login",
                "timestamp": "2023-01-15T10:30:00Z",
                "metadata": {
                  "ip": "192.168.1.1",
                  "userAgent": "Mozilla/5.0..."
                }
              }
            ]
          }
        }, null, 2)
      },
      
      array: {
        name: 'Array Example',
        description: 'JSON array with various data types',
        content: JSON.stringify([
          {
            "id": 1,
            "title": "First Item",
            "tags": ["important", "featured"],
            "metadata": {
              "created": "2023-01-01",
              "updated": "2023-01-15"
            }
          },
          {
            "id": 2,
            "title": "Second Item",
            "tags": ["draft"],
            "metadata": {
              "created": "2023-01-02",
              "updated": null
            }
          }
        ], null, 2)
      },
      
      api: {
        name: 'API Response',
        description: 'Example API response with pagination',
        content: JSON.stringify({
          "data": {
            "users": [
              {
                "id": 1,
                "name": "Alice",
                "email": "alice@example.com"
              },
              {
                "id": 2,
                "name": "Bob",
                "email": "bob@example.com"
              }
            ]
          },
          "pagination": {
            "page": 1,
            "limit": 10,
            "total": 25,
            "hasNext": true,
            "hasPrev": false
          },
          "meta": {
            "timestamp": "2023-01-15T12:00:00Z",
            "version": "v1.0.0"
          }
        }, null, 2)
      },
      
      error: {
        name: 'Error Example',
        description: 'Example of error response',
        content: JSON.stringify({
          "error": {
            "code": "VALIDATION_ERROR",
            "message": "Invalid input data",
            "details": [
              {
                "field": "email",
                "message": "Invalid email format"
              },
              {
                "field": "age",
                "message": "Age must be between 18 and 120"
              }
            ],
            "timestamp": "2023-01-15T12:00:00Z",
            "requestId": "req_123456789"
          }
        }, null, 2)
      }
    };
  }

  /**
   * Generate shareable URL with current content
   * @param {string} content - JSON content to share
   * @param {Object} options - URL generation options
   * @returns {string} Shareable URL
   */
  generateShareURL(content, options = {}) {
    const {
      includeSettings = false,
      settings = null,
      theme = null
    } = options;
    
    const url = new URL(window.location.origin + window.location.pathname);
    
    // Add JSON content (base64 encoded)
    try {
      const base64 = btoa(content);
      url.searchParams.set('input', base64);
    } catch (error) {
      console.warn('Failed to encode content for URL:', error);
    }
    
    // Add theme if specified
    if (theme) {
      url.searchParams.set('theme', theme);
    }
    
    // Add settings if requested
    if (includeSettings && settings) {
      try {
        const settingsBase64 = btoa(JSON.stringify(settings));
        url.searchParams.set('settings', settingsBase64);
      } catch (error) {
        console.warn('Failed to encode settings for URL:', error);
      }
    }
    
    return url.toString();
  }

  /**
   * Generate URL for loading JSON from external source
   * @param {string} jsonURL - URL to load JSON from
   * @param {Object} options - Additional options
   * @returns {string} Generated URL
   */
  generateLoadURL(jsonURL, options = {}) {
    const {
      theme = null,
      settings = null
    } = options;
    
    const url = new URL(window.location.origin + window.location.pathname);
    
    // Add JSON URL parameter
    url.searchParams.set('url', jsonURL);
    
    // Add theme if specified
    if (theme) {
      url.searchParams.set('theme', theme);
    }
    
    // Add settings if specified
    if (settings) {
      try {
        const settingsBase64 = btoa(JSON.stringify(settings));
        url.searchParams.set('settings', settingsBase64);
      } catch (error) {
        console.warn('Failed to encode settings for URL:', error);
      }
    }
    
    return url.toString();
  }

  /**
   * Update URL without page reload
   * @param {Object} params - Parameters to update
   */
  updateURL(params) {
    const url = new URL(window.location);
    
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, params[key]);
      }
    });
    
    // Update history
    window.history.pushState({}, '', url.toString());
    this.currentURL = url;
  }

  /**
   * Clear URL parameters
   */
  clearURL() {
    const url = new URL(window.location.origin + window.location.pathname);
    window.history.pushState({}, '', url.toString());
    this.currentURL = url;
  }

  /**
   * Get current URL parameters
   * @returns {Object} Current parameters
   */
  getCurrentParameters() {
    const params = {};
    this.currentURL.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  /**
   * Setup browser history handling
   */
  setupHistoryHandling() {
    // Handle back/forward navigation
    window.addEventListener('popstate', (e) => {
      this.currentURL = new URL(window.location);
      this.parseURLParameters();
    });
  }

  /**
   * Copy URL to clipboard
   * @param {string} url - URL to copy
   * @returns {Promise<boolean>} Whether copy was successful
   */
  async copyURL(url) {
    try {
      await navigator.clipboard.writeText(url);
      this.notifyListeners('urlCopied', { url });
      return true;
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        this.notifyListeners('urlCopied', { url });
        return true;
      } catch (fallbackError) {
        this.notifyListeners('urlCopyError', { url, error: fallbackError });
        return false;
      }
    }
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
          console.error('Error in URL handler listener:', error);
        }
      });
    }
  }
}