/**
 * Fires the flobro:// deep link for a URL handed over by the service worker
 * and, on first use, asks whether the desktop app actually opened. The
 * answer is remembered; see also popup.js which does the same in-popup.
 */
'use strict';

document.querySelectorAll('[data-msg]').forEach((el) => {
  el.textContent = chrome.i18n.getMessage(el.dataset.msg);
});

const url = new URLSearchParams(location.search).get('url');

(async () => {
  if (!url) {
    window.close();
    return;
  }
  const { appInstalled } = await chrome.storage.sync.get('appInstalled');
  document.getElementById('applink').src = flobroDeepLink(url);
  flobroTrack('forward_to_app', url);
  if (appInstalled === 'yes') {
    setTimeout(() => window.close(), 700);
  } else {
    document.getElementById('confirm').hidden = false;
  }
})();

document.getElementById('confirm-yes').addEventListener('click', async () => {
  await chrome.storage.sync.set({ appInstalled: 'yes' });
  window.close();
});

document.getElementById('confirm-no').addEventListener('click', async () => {
  await chrome.storage.sync.set({ appInstalled: 'no' });
  chrome.tabs.create({ url: 'https://flobro.app' });
  window.close();
});
