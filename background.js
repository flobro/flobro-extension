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

async function floatUrl(url) {
  const { width, height } = await flobroSettings();
  await chrome.windows.create({ url, type: 'popup', width, height, focused: true });
  flobroTrack('float_popup', url);
}

async function floatTab(tab) {
  const { width, height, moveTab } = await flobroSettings();
  if (!tab || !tab.id) return;
  if (moveTab) {
    // Move the existing tab into a popup window: keeps playback state, no reload.
    await chrome.windows.create({ tabId: tab.id, type: 'popup', width, height, focused: true });
    flobroTrack('float_popup', tab.url);
  } else if (tab.url) {
    await floatUrl(tab.url);
  }
}

/**
 * Hand a URL to the Flobro desktop app. Only fires the flobro:// link when we
 * know the app is installed (the popup asks the user once and remembers).
 * Otherwise the click opens flobro.app so the user can get the app, instead
 * of a link that silently does nothing.
 */
async function forwardToApp(url) {
  if (!url) return;
  const { appInstalled } = await chrome.storage.sync.get('appInstalled');
  if (appInstalled === 'yes') {
    const tab = await chrome.tabs.create({ url: flobroDeepLink(url), active: false });
    flobroTrack('forward_to_app', url);
    setTimeout(() => {
      chrome.tabs.remove(tab.id).catch?.(() => {});
    }, 2000);
  } else {
    await chrome.tabs.create({ url: 'https://flobro.app' });
  }
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
