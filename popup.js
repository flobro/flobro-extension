'use strict';

/* i18n */
document.querySelectorAll('[data-msg]').forEach((el) => {
  el.textContent = chrome.i18n.getMessage(el.dataset.msg);
});

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function fireDeepLink(url) {
  /* Navigating a hidden iframe to the flobro:// scheme launches the desktop
   * app without leaving a stray tab behind. If the app isn't installed,
   * nothing happens; we ask the user once and remember the answer. */
  document.getElementById('applink').src = flobroDeepLink(url);
}

document.getElementById('float-here').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: 'float-tab' });
  window.close();
});

document.getElementById('open-app').addEventListener('click', async () => {
  const tab = await currentTab();
  if (!tab || !tab.url) return;
  const { appInstalled } = await chrome.storage.sync.get('appInstalled');

  if (appInstalled === 'no') {
    /* No app installed: nudge the download instead of doing nothing */
    chrome.tabs.create({ url: 'https://flobro.app' });
    window.close();
    return;
  }

  fireDeepLink(tab.url);
  flobroTrack('forward_to_app', tab.url);

  if (appInstalled === 'yes') {
    setTimeout(() => window.close(), 500);
  } else {
    /* First time: ask whether it worked and remember the answer */
    document.getElementById('confirm').classList.add('visible');
  }
});

document.getElementById('confirm-yes').addEventListener('click', async () => {
  await chrome.storage.sync.set({ appInstalled: 'yes' });
  window.close();
});

document.getElementById('confirm-no').addEventListener('click', async () => {
  await chrome.storage.sync.set({ appInstalled: 'no' });
  chrome.tabs.create({ url: 'https://flobro.app' });
  window.close();
});
