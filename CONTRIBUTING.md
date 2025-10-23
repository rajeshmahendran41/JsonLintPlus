# Contributing to JsonlintPlus

Thank you for your interest in contributing! This guide explains how to propose changes, report issues, and submit pull requests.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Build, Test, and Lint](#build-test-and-lint)
- [Branching and Commit Messages](#branching-and-commit-messages)
- [Pull Request Checklist](#pull-request-checklist)
- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [Security](#security)
- [License](#license)

## Code of Conduct
Participation in this project is governed by our Code of Conduct: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). By contributing, you agree to abide by it.

## Ways to Contribute
- Report bugs and request features via GitHub Issues
- Fix open issues and submit improvements with PRs
- Improve documentation and examples
- Suggest performance or accessibility enhancements
- Help triage issues or review PRs

## Development Setup
1. Fork and clone the repository
2. Install Node.js (v18+ recommended; CI uses Node 22)
3. Install dependencies:
   ```
   npm ci
   ```
4. Run locally:
   - Non-optimized dev server:
     ```
     npm run dev
     ```
   - Production build preview:
     ```
     npm run build
     npm run preview
     ```

Key scripts:
- Build system: [`scripts/build.mjs`](scripts/build.mjs)
- CI workflow: [`.github/workflows/build.yml`](.github/workflows/build.yml)
- Smoke tests (optional): [`tests/smoke.test.mjs`](tests/smoke.test.mjs)

## Build, Test, and Lint
- Build:
  ```
  npm run build
  ```
- Preview:
  ```
  npm run preview
  ```
- Smoke test (requires `dist/`):
  ```
  node tests/smoke.test.mjs
  ```
- Linting: The project favors consistent, readable vanilla JS/HTML/CSS. If you add linter or formatter configs, include them with clear instructions.

## Branching and Commit Messages
- Create a feature branch from `main`:
  ```
  git checkout -b feat/your-feature
  ```
- Use conventional-style commit messages when possible:
  - `feat: add PWA manifest`
  - `fix: service worker registration for GH Pages`
  - `docs: add deployment instructions`
  - `chore: update workflow`
  - `perf: optimize build preloads`
- Keep commits focused and small; prefer multiple commits over one large change.

## Pull Request Checklist
Before opening a PR:
- The change builds successfully: `npm run build`
- If applicable, preview works: `npm run preview`
- Update or add documentation in [`README.md`](README.md) where appropriate
- Include tests or manual verification steps (e.g., run [`tests/smoke.test.mjs`](tests/smoke.test.mjs))
- Ensure no build artifacts (`dist/`) or local files are committed (see [.gitignore](.gitignore))
- Link related issues in the PR description

PR Guidelines:
- Clear title and description
- Explain rationale and risks
- Screenshots/GIFs for UI changes
- Keep changes minimal; split into multiple PRs if large

## Issue Reporting Guidelines
When filing an issue, include:
- Steps to reproduce with a minimal example
- Expected vs. actual behavior
- Browser and OS details
- Screenshots (if UI-related)
- Any console errors
- Whether issue happens in dev (`npm run dev`) or build preview (`npm run preview`)

Feature requests:
- Describe use-case and benefits
- Outline proposed API/UX
- Consider impact on performance and accessibility

## Security
Do not open public issues for security vulnerabilities. Please follow responsible disclosure outlined in [`SECURITY.md`](SECURITY.md).

## License
By contributing, you agree your contributions will be licensed under the project’s license: [`LICENSE`](LICENSE).

Thank you for helping improve JsonlintPlus!