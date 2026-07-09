# AGENTS.md

Guidance for AI coding agents working on flobro-extension. Human docs live in README.md
and CONTRIBUTING.md; this file is for you.

## Project

Flobro Chrome extension: float any tab, link or video in a minimal popup window, or forward it to the Flobro desktop app.

background.js is the service worker; shared.js holds settings/analytics/deep-link helpers used by popup.js and options.js; _locales/ holds en and nl translations (chrome.i18n).

## Setup

Run `npm install` once to activate git hooks and dev tooling. Load the extension via chrome://extensions -> Developer mode -> Load unpacked -> this folder.

## Commands

- Run locally: `Load unpacked in Chrome; reload the extension after changes.`
- Build: `zip the folder for Chrome Web Store submission (exclude node_modules and dot-directories)`
- Lint: `npm run lint` (Biome). Auto-fix: `npm run lint:fix`
- Tests: npm run lint, then manual: toolbar popup, context menus, options page, forward-to-app flow

## Code style

- Biome is the formatter and linter: 2-space indent, single quotes, semicolons, line width 100. Do not hand-format against it.
- Plain JavaScript only, no frameworks and no build step. Keep it that way.
- All user-facing strings must exist in BOTH English and Dutch. English is the source language.

## Commits and PRs

- Conventional Commits are enforced by a commit-msg hook: `<type>(<scope>): <description>` with types build/chore/ci/docs/feat/fix/perf/refactor/revert/style/test.
- The changelog is generated from commits (commitizen + Keep a Changelog). Write commit descriptions that read well as release notes.
- Never commit secrets. Analytics keys are public-by-design PostHog project keys, but Apple signing secrets live only in GitHub Actions secrets.

## Boundaries

- Do not add cookies, fingerprinting or any tracking beyond the existing hostname-only PostHog events; the privacy page (flobro.app/privacy.html) is a promise, not decoration.
- Do not add dependencies without a very good reason; the project's identity is being lightweight.
