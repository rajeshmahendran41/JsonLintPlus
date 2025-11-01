/**
 * Theme Initialization Script
 * Loads and applies saved theme from localStorage on all pages
 */

(function() {
  'use strict';

  function initializeTheme() {
    try {
      let savedTheme = 'light'; // Default theme

      // First, try to get theme from SettingsManager storage
      const settingsData = localStorage.getItem('jsonValidatorSettings');
      if (settingsData) {
        try {
          const settings = JSON.parse(settingsData);
          if (settings.theme && (settings.theme === 'light' || settings.theme === 'dark')) {
            savedTheme = settings.theme;
          }
        } catch (e) {
          console.warn('Failed to parse settings data:', e);
        }
      }

      // Fallback: try the simple theme storage used by ui.js
      const simpleTheme = localStorage.getItem('jsonValidatorTheme');
      if (simpleTheme && (simpleTheme === 'light' || simpleTheme === 'dark')) {
        savedTheme = simpleTheme;
      }

      // Apply the theme
      document.body.setAttribute('data-theme', savedTheme);

      // Update theme toggle button if it exists
      updateThemeToggleButton(savedTheme);

    } catch (error) {
      console.warn('Failed to initialize theme:', error);
      // Fallback to light theme
      document.body.setAttribute('data-theme', 'light');
    }
  }

  function updateThemeToggleButton(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      const lightIcon = themeToggle.querySelector('.theme-icon-light');
      const darkIcon = themeToggle.querySelector('.theme-icon-dark');

      if (lightIcon && darkIcon) {
        if (theme === 'dark') {
          lightIcon.style.display = 'none';
          darkIcon.style.display = 'block';
        } else {
          lightIcon.style.display = 'block';
          darkIcon.style.display = 'none';
        }
      }
    }
  }

  // Initialize theme immediately
  initializeTheme();

  // Also initialize on DOMContentLoaded in case the script runs before body exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
  }

})();