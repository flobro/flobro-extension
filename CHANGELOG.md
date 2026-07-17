# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Entries are
generated from [Conventional Commits](https://www.conventionalcommits.org)
using [commitizen](https://commitizen-tools.github.io/commitizen/) (`cz bump`).


### Added

- Toolbar popup with two actions: float the tab in a minimal popup window, or open it in the Flobro desktop app
- Right-click menu: float page/link/video and forward to the desktop app
- One-time detection question remembers whether the desktop app is installed; without it, forwards nudge to flobro.app
- Options: default window size, move-vs-copy, analytics opt-out, detection reset
- English and Dutch via _locales
- Privacy-friendly, hostname-only usage stats via PostHog EU with opt-out

[Unreleased]: https://github.com/flobro/flobro-extension/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/flobro/flobro-extension/releases/tag/v1.0.0

## v1.1.0 (2026-07-17)

### Feat

- send extension version to PostHog as app_version

## v1.0.1 (2026-07-15)

### Feat

- release workflow that packages the store zip and can publish to the Chrome Web Store
- initial release

### Fix

- ask about the desktop app when forwarding from the context menu, add unfloat menu, fix linklike hover
