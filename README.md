# JSON Validator & Formatter

A lightweight, single-page static website that validates and formats JSON data entirely in the browser with no backend dependencies.

## Features

### Core Functionality
- **JSON Validation**: Parse and validate JSON syntax in real-time with detailed error messages
- **JSON Formatting**: Convert minified/compressed JSON into readable, indented format
- **JSON Minification**: Remove all whitespace and reduce JSON file size
- **Error Detection**: Highlight common errors with line numbers and character positions
- **Syntax Highlighting**: Color-coded display for different JSON elements

### User Interface
- **Single Content Area**: Dual-mode interface that switches between input and output
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between light and dark themes
- **Real-time Validation**: Optional validation as you type with debouncing
- **Mode Switching**: Smooth animations between input and output modes

### Advanced Features
- **File Upload**: Drag-and-drop or browse to upload JSON files (up to 10MB)
- **Export Options**: Download formatted JSON as a file
- **Keyboard Shortcuts**: Productivity shortcuts for common actions
- **URL Parameters**: Load JSON from URL parameters
- **Settings Panel**: Customizable indentation, validation, and display options
- **Local Storage**: Save work between sessions

## Quick Start

1. **Open the Application**: Simply open `index.html` in your web browser
2. **Input JSON**: Paste or type your JSON data in the input area
3. **Validate**: Click "Validate" or press Ctrl+Enter to check JSON syntax
4. **Format**: Use "Format" (Ctrl+B) to beautify or "Minify" (Ctrl+M) to compress
5. **Export**: Copy to clipboard or download as a file

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Validate JSON |
| `Ctrl+B` | Format/Beautify JSON |
| `Ctrl+M` | Minify JSON |
| `Ctrl+K` | Clear all content |
| `Ctrl+C` | Copy to clipboard |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save/Download file |
| `Ctrl+,` | Toggle settings |
| `Ctrl+D` | Toggle theme |
| `Ctrl+/` | Show help |
| `Escape` | Cancel/Close dialogs |

*Mac users use `Cmd` instead of `Ctrl`*

## URL Parameters

The application supports various URL parameters for sharing and automation:

- `input` - Direct JSON input (base64 encoded or plain)
- `url` - Load JSON from external URL
- `theme` - Set theme (`light` or `dark`)
- `settings` - Import settings (base64 encoded)
- `example` - Load example JSON

### Examples

```
# Load JSON directly
index.html?input=eyJuYW1lIjogIkpvaG4ifQ==

# Load from URL
index.html?url=https://api.example.com/data.json

# Set theme
index.html?theme=dark

# Load example
index.html?example=simple
```

## File Structure

```
project/
│
├── index.html              # Main HTML file
├── css/
│   ├── style.css           # Main stylesheet
│   ├── theme.css           # Light/dark theme styles
│   ├── responsive.css      # Media queries for responsive design
│   └── components.css      # Additional component styles
├── js/
│   ├── main.js             # Application entry point
│   ├── validator.js        # JSON validation logic
│   ├── formatter.js        # Format/minify functions
│   ├── ui.js               # UI interactions and mode switching
│   ├── settings.js         # Settings management
│   ├── fileHandler.js      # File upload/export functionality
│   ├── urlHandler.js       # URL parameter processing
│   └── keyboard.js         # Keyboard shortcuts
├── assets/
│   └── icons/              # Icons and images
├── test-examples.json      # Test examples (valid and invalid)
├── valid-examples.json     # Valid test examples
└── README.md               # This file
```

## Browser Compatibility

- **Chrome 90+**: Full feature support
- **Firefox 88+**: Full feature support
- **Safari 14+**: Full feature support
- **Edge 90+**: Full feature support

## Performance

- **Validation Speed**: < 100ms for 1MB JSON
- **Formatting Speed**: < 500ms for 1MB JSON
- **Memory Usage**: < 100MB for typical usage
- **File Size Limit**: 10MB maximum file size

## Security

- **Client-Side Processing**: All validation happens in the browser
- **No Data Transmission**: User data never leaves their device
- **Privacy-Friendly**: No tracking or analytics
- **Safe File Handling**: Validates file types and sizes

## Settings

The application offers various customizable settings:

- **Indentation**: 2 spaces, 4 spaces, or tab
- **Real-time Validation**: Validate as you type
- **Auto-format**: Format on paste
- **Show Line Numbers**: Display line numbers in editor
- **Theme**: Light or dark mode
- **Font Size**: Adjustable editor font size

## Development

### Local Development

1. Clone or download the project
2. Open `index.html` in a web browser
3. No build process or server required

### Testing

Test files are included:
- `valid-examples.json` - Valid JSON examples
- `test-examples.json` - Mixed valid and invalid examples

### Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Technical Details

### Architecture

The application uses a modular architecture with separate concerns:

- **Validator Module**: Handles JSON parsing and error detection
- **Formatter Module**: Manages beautifying and minification
- **UI Controller**: Manages interface interactions and mode switching
- **Settings Manager**: Handles user preferences and localStorage
- **File Handler**: Manages file uploads and downloads
- **URL Handler**: Processes URL parameters and external JSON loading
- **Keyboard Shortcuts**: Manages keyboard navigation and shortcuts

### Technologies Used

- **HTML5**: Semantic markup and accessibility features
- **CSS3**: Modern styling with custom properties and flexbox/grid
- **Vanilla JavaScript**: ES6+ modules with no framework dependencies
- **CodeMirror 6**: Advanced code editing (optional, falls back to textarea)

### Performance Optimizations

- **Debouncing**: Real-time validation with configurable delay
- **Lazy Loading**: Resources loaded only when needed
- **Efficient DOM Manipulation**: Minimal reflows and repaints
- **Memory Management**: Proper cleanup of event listeners and references

## Deployment and Hosting

This project is ready for enterprise-grade static hosting with hashed assets, a PWA, hardened server config, containerization, and CI/CD.

- Build artifacts:
  - Run:
    - `npm ci --no-audit --no-fund`
    - `npm run build`
  - The build outputs the production site into `dist/` using [`scripts/build.mjs`](scripts/build.mjs).
  - Assets are cache-busted and referenced via the generated manifest.

- Static preview and local dev:
  - Preview the built site:
    - `npm run preview` (serves `dist/` on http://localhost:5173)
  - Serve the source directly (non-optimized):
    - `npm run dev` (serves project root on http://localhost:5173)

- Server configuration:
  - A hardened NGINX configuration is provided at [`deploy/nginx.conf`](deploy/nginx.conf). It sets:
    - Security headers (CSP, HSTS, X-Content-Type-Options, etc.)
    - Long-lived caching for hashed assets `/assets/css/*.hash.css`, `/assets/js/*.hash.js`
    - No-cache for `index.html`, `manifest.json`, `service-worker.js`, and top-level routes
    - SPA fallback to `index.html`

- Docker:
  - A production container is defined by [`Dockerfile`](Dockerfile). It builds with Node and serves via NGINX:
    - Build: `docker build -t jsonlintplus .`
    - Run: `docker run -p 8080:80 jsonlintplus`
    - The container uses the NGINX config at `/etc/nginx/nginx.conf` copied from [`deploy/nginx.conf`](deploy/nginx.conf).

- CI/CD:
  - GitHub Actions workflow is set up at [`.github/workflows/build.yml`](.github/workflows/build.yml).
  - On pushes to `main`, it:
    - Builds the site and uploads the `dist/` artifact
    - Deploys to GitHub Pages (if enabled in repository settings)
    - Optionally builds and pushes a Docker image to Docker Hub when secrets are provided:
      - `DOCKERHUB_USERNAME`
      - `DOCKERHUB_TOKEN`

- Progressive Web App (PWA):
  - Manifest is at [`public/manifest.json`](public/manifest.json) with icons (add files under `/public/icons/`).
  - Service Worker is at [`public/service-worker.js`](public/service-worker.js) and is registered based on config by [`js/env.js`](js/env.js).
  - `index.html` includes appropriate PWA meta (`theme-color`, `manifest`, `apple-touch-icon`) and SEO tags (Open Graph, Twitter Card, canonical).

- Runtime configuration:
  - Runtime config is loaded from [`config/env.json`](config/env.json) at startup by [`js/env.js`](js/env.js).
  - Keys:
    - `environment`: "production" | "staging" | "development"
    - `logLevel`: "debug" | "info" | "warn" | "error" | "silent"
    - `logEndpoint`: optional endpoint to POST logs (if you enable remote logging)
    - `enablePwa`: boolean to toggle Service Worker registration
  - The configuration is exposed as `window.APP_CONFIG` and `window.Env`.

- Logging and error handling:
  - Centralized logging is provided by [`js/logger.js`](js/logger.js) with leveled logging and global error handlers.
  - Remote forwarding can be enabled via `logEndpoint` in [`config/env.json`](config/env.json).

- SEO and Accessibility:
  - Enhanced meta tags in [`index.html`](index.html) (Open Graph, Twitter Card, application-name, canonical, robots).
  - Accessibility features include skip links, ARIA landmarks, and focus styles.

- Caching strategy:
  - Hashed assets are served with `Cache-Control: immutable, max-age=31536000`.
  - HTML, manifest, and service worker are served with `no-cache` headers to ensure updates propagate quickly.
  - Build script injects preloads for critical assets and rewrites references to hashed filenames.

- Notes for different hosts:
  - GitHub Pages: Security headers like CSP are not configurable via server; meta-based hints (theme-color) are present but CSP requires a reverse proxy/CDN to enforce.
  - Cloud/CDN hosting: Copy `dist/` and configure caching rules analogous to [`deploy/nginx.conf`](deploy/nginx.conf). Ensure `index.html` is not cached or cache is short-lived.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues, questions, or contributions:

1. Check the existing issues
2. Create a new issue with detailed information
3. Include browser version and steps to reproduce

## Changelog

### Version 1.0.0
- Initial release
- Core JSON validation and formatting
- Responsive design
- Dark/light theme support
- File upload and export
- Keyboard shortcuts
- URL parameter support
- Settings management
- Accessibility features