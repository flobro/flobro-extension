# Releasing flobro-extension

Developer documentation. Releases are built and, when the store secrets are present, submitted to the Chrome Web Store by GitHub Actions. Pushing `main` never releases; only a `v*` tag does.

## Prerequisites (already configured, listed for reference)

Repository secrets: `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN` (Google Cloud OAuth client with the Chrome Web Store API enabled). Without them the workflow still builds the GitHub release and skips the store upload with a notice.

Locally: `pip install commitizen` and a platform-matching `node_modules` (`rm -rf node_modules && npm install` after switching machines).

## Release steps

1. Land all work on `main` as Conventional Commits (`cz commit`).
2. Bump and tag:

   ```bash
   cz bump          # next semver from the commits; updates manifest.json and
                    # package.json (version_files), CHANGELOG.md, creates the tag
   ```

   Tidy the new `CHANGELOG.md` section (cz does not follow the Keep a Changelog layout).
3. Push: `git push && git push --tags`.
4. CI then, in order:
   - verifies `manifest.json` version equals the tag (mismatch fails the build on purpose; fix the version, `git tag -f`, force-push the tag);
   - builds `flobro-extension-x.y.z.zip` with only the runtime files;
   - creates a published GitHub release with the zip attached;
   - uploads the zip to the Chrome Web Store and submits it for review (`--auto-publish`: it goes live when Google approves, typically within a few days).
5. Nothing else to do. The store listing URL is stable and already linked from the website.

## Manual store upload (fallback)

If the store secrets are unavailable, take the zip from the GitHub release and upload it at the [developer dashboard](https://chrome.google.com/webstore/devconsole) (Google account: see FLOBRO-CONTEXT). Dutch and English listing texts exist; the store images (tile, screenshots, also in Dutch) live in `branding/marketing/`.

## Troubleshooting

- **`PKG_INVALID_VERSION_NUMBER`**: the store already has this or a higher version. Bump again; each store upload needs a strictly higher `manifest.json` version.
- **Store upload rejected while a review is pending**: wait for the running review to finish or withdraw it in the dashboard, then re-run the `publish` job.
- **Testing before tagging**: load the repo unpacked via `chrome://extensions` (Developer mode). Test the flobro:// forward against an installed desktop app.
