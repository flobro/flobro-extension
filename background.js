/**
 * Flobro extension service worker.
 *
 * Two modes:
 *  1. Float in a minimal popup window, right in the browser.
 *  2. Forward to the Flobro desktop app via the flobro:// deep link for true
 *     always-on-top floating.
 */
'use strict';

importScripts('shared.js');

const msg = (key) => chrome.i18n.getMessage(key);

/* Windows this extension floated, so "unfloat" knows its own popups even
 * after a service worker restart (session storage survives those). */
async function rememberFloated(windowId) {
  if (windowId == null) return;
  const { floated = [] } = await chrome.storage.session.get('floated');
  if (!floated.includes(windowId)) floated.push(windowId);
  await chrome.storage.session.set({ floated });
}

async function forgetFloated(windowId) {
  const { floated = [] } = await chrome.storage.session.get('floated');
  await chrome.storage.session.set({ floated: floated.filter((id) => id !== windowId) });
}

async function floatUrl(url) {
  const { width, height } = await flobroSettings();
  const win = await chrome.windows.create({ url, type: 'popup', width, height, focused: true });
  await rememberFloated(win && win.id);
  flobroTrack('float_popup', url);
}

async function floatTab(tab) {
  const { width, height, moveTab } = await flobroSettings();
  if (!tab || !tab.id) return;
  if (moveTab) {
    // Move the existing tab into a popup window: keeps playback state, no reload.
    const win = await chrome.windows.create({
      tabId: tab.id,
      type: 'popup',
      width,
      height,
      focused: true,
    });
    await rememberFloated(win && win.id);
    flobroTrack('float_popup', tab.url);
  } else if (tab.url) {
    await floatUrl(tab.url);
  }
}

/**
 * Move a floated tab back into a normal browser window. Prefers the last
 * focused normal window; creates a fresh one when none is left.
 */
async function unfloat(tab) {
  if (!tab || tab.id == null) return;
  const fromWindow = tab.windowId;
  let target = null;
  try {
    const wins = await chrome.windows.getAll({ windowTypes: ['normal'] });
    target = wins.find((w) => w.focused) || wins[wins.length - 1] || null;
  } catch {
    /* fall through to creating a window */
  }
  if (target) {
    await chrome.tabs.move(tab.id, { windowId: target.id, index: -1 });
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(target.id, { focused: true });
  } else {
    await chrome.windows.create({ tabId: tab.id });
  }
  await forgetFloated(fromWindow);
}

/**
 * Hand a URL to the Flobro desktop app. A tiny extension page fires the
 * flobro:// deep link (extension pages can do that reliably, a service
 * worker cannot) and asks once whether the app opened, remembering the
 * answer. When the user already said the app is not installed, nudge the
 * download page instead of a link that silently does nothing.
 */
async function forwardToApp(url) {
  if (!url) return;
  const { appInstalled } = await chrome.storage.sync.get('appInstalled');
  if (appInstalled === 'no') {
    await chrome.tabs.create({ url: 'https://flobro.app' });
    return;
  }
  await chrome.windows.create({
    url: chrome.runtime.getURL(`forward.html?url=${encodeURIComponent(url)}`),
    type: 'popup',
    width: 380,
    height: 230,
    focused: true,
  });
}

/* Context menus */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'flobro-page', title: msg('ctxFloatPage'), contexts: ['page'] });
  chrome.contextMenus.create({ id: 'flobro-link', title: msg('ctxFloatLink'), contexts: ['link'] });
  chrome.contextMenus.create({
    id: 'flobro-video',
    title: msg('ctxFloatVideo'),
    contexts: ['video'],
  });
  chrome.contextMenus.create({ id: 'sep', type: 'separator', contexts: ['page', 'link'] });
  chrome.contextMenus.create({
    id: 'flobro-app-page',
    title: msg('ctxForwardPage'),
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: 'flobro-app-link',
    title: msg('ctxForwardLink'),
    contexts: ['link'],
  });
  chrome.contextMenus.create({
    id: 'flobro-unfloat',
    title: msg('ctxUnfloat'),
    contexts: ['page', 'video'],
    visible: false,
  });
});

/* Show "unfloat" only inside floated windows: our own tracked popups, or any
 * popup window as a fallback (covers floats from before a browser restart). */
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  let visible = false;
  try {
    const win = await chrome.windows.get(windowId);
    /* Tracked floats for sure; any other popup window is close enough
     * (chromeless, so it was almost certainly floated by us). */
    visible = win.type === 'popup';
  } catch {
    /* window gone */
  }
  try {
    await chrome.contextMenus.update('flobro-unfloat', { visible });
  } catch {
    /* menu not created yet */
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  forgetFloated(windowId);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'flobro-link':
      if (info.linkUrl) floatUrl(info.linkUrl);
      break;
    case 'flobro-video':
      if (info.srcUrl) floatUrl(info.srcUrl);
      break;
    case 'flobro-page':
      floatTab(tab);
      break;
    case 'flobro-app-page':
      forwardToApp(tab && tab.url);
      break;
    case 'flobro-app-link':
      forwardToApp(info.linkUrl);
      break;
    case 'flobro-unfloat':
      unfloat(tab);
      break;
  }
});

/* Messages from the popup */
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  (async () => {
    if (request.action === 'float-tab') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await floatTab(tab);
    }
    sendResponse({ ok: true });
  })();
  return true;
});
