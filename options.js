'use strict';

/* i18n */
document.querySelectorAll('[data-msg]').forEach((el) => {
  el.textContent = chrome.i18n.getMessage(el.dataset.msg);
});

async function load() {
  const s = await flobroSettings();
  document.getElementById('width').value = s.width;
  document.getElementById('height').value = s.height;
  document.getElementById('moveTab').checked = s.moveTab;
  document.getElementById('shareUsage').checked = s.shareUsage;
}

document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.sync.set({
    width: Math.max(
      200,
      parseInt(document.getElementById('width').value, 10) || FLOBRO_DEFAULTS.width,
    ),
    height: Math.max(
      120,
      parseInt(document.getElementById('height').value, 10) || FLOBRO_DEFAULTS.height,
    ),
    moveTab: document.getElementById('moveTab').checked,
    shareUsage: document.getElementById('shareUsage').checked,
  });
  const status = document.getElementById('status');
  status.textContent = chrome.i18n.getMessage('optSaved');
  setTimeout(() => {
    status.textContent = '';
  }, 1800);
});

document.getElementById('reset-detect').addEventListener('click', async (e) => {
  e.preventDefault();
  await chrome.storage.sync.remove('appInstalled');
  const status = document.getElementById('status');
  status.textContent = chrome.i18n.getMessage('optResetDone');
  setTimeout(() => {
    status.textContent = '';
  }, 2500);
});

load();
