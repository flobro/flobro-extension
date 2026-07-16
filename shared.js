/**
 * Shared helpers for the Flobro extension: settings, deep links, analytics.
 * Loaded by both the service worker (importScripts) and the popup/options pages.
 */
'use strict';

const FLOBRO_DEFAULTS = { width: 560, height: 348, moveTab: true, shareUsage: true };

/* Privacy-friendly usage stats via PostHog (EU cloud).
 * Hostname only, no IP ($ip: null), random anonymous id.
 * Nothing is sent while the placeholder key is in place. */
const FLOBRO_PH_KEY = 'phc_tmfA5uemSD7TscmzLWQPAiqYXxfNartjfYsrjWQ6rEot';
const FLOBRO_PH_HOST = 'https://eu.i.posthog.com';

async function flobroSettings() {
  const stored = await chrome.storage.sync.get(FLOBRO_DEFAULTS);
  return { ...FLOBRO_DEFAULTS, ...stored };
}

async function flobroAnonId() {
  const { anonId } = await chrome.storage.local.get('anonId');
  if (anonId) return anonId;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ anonId: id });
  return id;
}

async function flobroTrack(event, url) {
  try {
    const settings = await flobroSettings();
    if (!settings.shareUsage || FLOBRO_PH_KEY.includes('REPLACE_ME')) return;
    let hostname;
    if (url) {
      try {
        hostname = new URL(url).hostname;
      } catch (_) {
        /* skip */
      }
    }
    await fetch(FLOBRO_PH_HOST + '/capture/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: FLOBRO_PH_KEY,
        event,
        distinct_id: await flobroAnonId(),
        properties: {
          $ip: null,
          source: 'extension',
          app_version: chrome.runtime.getManifest().version,
          ...(hostname ? { hostname } : {}),
        },
      }),
    });
  } catch (_) {
    /* analytics must never break the extension */
  }
}

function flobroDeepLink(url) {
  return 'flobro://open?url=' + encodeURIComponent(url);
}
