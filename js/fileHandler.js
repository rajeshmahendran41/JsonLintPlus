/**
 * File Handler Module
 * Manages file uploads, downloads, and drag-and-drop functionality
 */

export class FileHandler {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.acceptedTypes = ['application/json', 'text/plain'];
    this.dragCounter = 0;
    this.listeners = new Map();
    this.init();
  }

  /**
   * Initialize file handler
   */
  init() {
    this.setupDragAndDrop();
    this.setupFileInput();
    this.setupPasteHandler();
  }

  /**
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    const dropOverlay = document.getElementById('file-drop-overlay');
    const contentArea = document.getElementById('content-area');
    
    if (!dropOverlay || !contentArea) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, this.preventDefaults, false);
      contentArea.addEventListener(eventName, this.preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      contentArea.addEventListener(eventName, this.highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      contentArea.addEventListener(eventName, this.unhighlight, false);
    });

    // Handle dropped files
    contentArea.addEventListener('drop', this.handleDrop.bind(this), false);

    // Handle drop overlay clicks
    dropOverlay.addEventListener('click', () => {
      this.hideDropOverlay();
    });
  }

  /**
   * Setup file input functionality
   */
  setupFileInput() {
    const fileInput = document.getElementById('file-input');
    const hiddenFileInput = document.getElementById('hidden-file-input');
    
    if (fileInput) {
      fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }
    
    if (hiddenFileInput) {
      hiddenFileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }
  }

  /**
   * Setup paste handler for JSON content
   */
  setupPasteHandler() {
    document.addEventListener('paste', this.handlePaste.bind(this));
  }

  /**
   * Prevent default drag behaviors
   * @param {Event} e - Drag event
   */
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Highlight drop area
   * @param {Event} e - Drag event
   */
  highlight(e) {
    this.dragCounter++;
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      contentArea.classList.add('drag-over');
    }
  }

  /**
   * Unhighlight drop area
   * @param {Event} e - Drag event
   */
  unhighlight(e) {
    this.dragCounter--;
    if (this.dragCounter === 0) {
      const contentArea = document.getElementById('content-area');
      if (contentArea) {
        contentArea.classList.remove('drag-over');
      }
    }
  }

  /**
   * Handle file drop
   * @param {Event} e - Drop event
   */
  async handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    this.unhighlight(e);
    this.hideDropOverlay();
    
    if (files.length > 0) {
      await this.processFiles(files);
    }
  }

  /**
   * Handle file selection from input
   * @param {Event} e - Change event
   */
  async handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      await this.processFiles(files);
    }
    
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }

  /**
   * Handle paste event
   * @param {Event} e - Paste event
   */
  async handlePaste(e) {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.kind === 'file') {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await this.processFiles([file]);
        }
        break;
      }
    }
  }

  /**
   * Process uploaded files
   * @param {FileList} files - List of files to process
   */
  async processFiles(files) {
    // Process only the first file for now
    const file = files[0];
    
    try {
      this.notifyListeners('fileProcessing', { file });
      
      const result = await this.readFile(file);
      
      this.notifyListeners('fileProcessed', {
        file,
        content: result.content,
        size: result.size
      });
      
      return result;
    } catch (error) {
      this.notifyListeners('fileError', { file, error });
      throw error;
    }
  }

  /**
   * Read file content
   * @param {File} file - File to read
   * @returns {Promise<Object>} File content and metadata
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        reject(new Error(validation.error));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve({
          content: e.target.result,
          size: file.size,
          name: file.name,
          type: file.type,
          lastModified: file.lastModified
        });
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Validate file
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`
      };
    }
    
    // Check file type
    const isValidType = this.acceptedTypes.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.json');
    
    if (!isValidType) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a JSON file'
      };
    }
    
    return { valid: true };
  }

  /**
   * Show file drop overlay
   */
  showDropOverlay() {
    const overlay = document.getElementById('file-drop-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Hide file drop overlay
   */
  hideDropOverlay() {
    const overlay = document.getElementById('file-drop-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Download content as a file
   * @param {string} content - Content to download
   * @param {string} filename - Filename for download
   * @param {string} mimeType - MIME type for the file
   */
  downloadFile(content, filename = 'output.json', mimeType = 'application/json') {
    try {
      // Create blob
      const blob = new Blob([content], { type: mimeType });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      this.notifyListeners('fileDownloaded', { filename, size: content.length });
    } catch (error) {
      this.notifyListeners('downloadError', { filename, error });
      throw error;
    }
  }

  /**
   * Download JSON content
   * @param {string|Object} jsonContent - JSON content to download
   * @param {string} filename - Filename for download
   * @param {boolean} formatted - Whether to format the JSON
   */
  downloadJSON(jsonContent, filename = 'output.json', formatted = true) {
    let content;
    
    if (typeof jsonContent === 'object') {
      content = formatted ? 
        JSON.stringify(jsonContent, null, 2) : 
        JSON.stringify(jsonContent);
    } else {
      content = jsonContent;
    }
    
    this.downloadFile(content, filename, 'application/json');
  }

  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file information
   * @param {File} file - File to analyze
   * @returns {Object} File information
   */
  getFileInfo(file) {
    return {
      name: file.name,
      size: file.size,
      sizeFormatted: this.formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString(),
      extension: file.name.split('.').pop().toLowerCase()
    };
  }

  /**
   * Check if file is a JSON file
   * @param {File} file - File to check
   * @returns {boolean} Whether file is JSON
   */
  isJSONFile(file) {
    return file.type === 'application/json' || 
           file.name.toLowerCase().endsWith('.json');
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
          console.error('Error in file handler listener:', error);
        }
      });
    }
  }

  /**
   * Show file picker dialog
   * @returns {Promise<FileList>} Selected files
   */
  showFilePicker() {
    return new Promise((resolve, reject) => {
      const input = document.getElementById('hidden-file-input');
      if (!input) {
        reject(new Error('File input not found'));
        return;
      }
      
      input.onchange = (e) => {
        if (e.target.files.length > 0) {
          resolve(e.target.files);
        } else {
          reject(new Error('No file selected'));
        }
      };
      
      input.click();
    });
  }

  /**
   * Save content to browser storage
   * @param {string} content - Content to save
   * @param {string} key - Storage key
   */
  saveToStorage(content, key = 'jsonValidatorContent') {
    try {
      localStorage.setItem(key, content);
      this.notifyListeners('contentSaved', { key, size: content.length });
    } catch (error) {
      this.notifyListeners('storageError', { key, error });
      throw error;
    }
  }

  /**
   * Load content from browser storage
   * @param {string} key - Storage key
   * @returns {string|null} Loaded content
   */
  loadFromStorage(key = 'jsonValidatorContent') {
    try {
      const content = localStorage.getItem(key);
      if (content) {
        this.notifyListeners('contentLoaded', { key, size: content.length });
      }
      return content;
    } catch (error) {
      this.notifyListeners('storageError', { key, error });
      return null;
    }
  }

  /**
   * Clear content from browser storage
   * @param {string} key - Storage key
   */
  clearStorage(key = 'jsonValidatorContent') {
    try {
      localStorage.removeItem(key);
      this.notifyListeners('storageCleared', { key });
    } catch (error) {
      this.notifyListeners('storageError', { key, error });
      throw error;
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage info
   */
  getStorageInfo() {
    try {
      let totalSize = 0;
      let itemCount = 0;
      
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
          itemCount++;
        }
      }
      
      return {
        totalSize,
        totalSizeFormatted: this.formatFileSize(totalSize),
        itemCount,
        quota: 5 * 1024 * 1024, // 5MB typical localStorage limit
        quotaFormatted: this.formatFileSize(5 * 1024 * 1024),
        usagePercent: (totalSize / (5 * 1024 * 1024)) * 100
      };
    } catch (error) {
      return {
        totalSize: 0,
        totalSizeFormatted: '0 Bytes',
        itemCount: 0,
        quota: 0,
        quotaFormatted: '0 Bytes',
        usagePercent: 0,
        error: error.message
      };
    }
  }
}