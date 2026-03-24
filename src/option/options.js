const DEFAULTS = {
  speedStep: 0.25,
  slowerKeyCode: 'NumpadSubtract,Minus',
  fasterKeyCode: 'NumpadAdd,Equal',
  resetKeyCode: 'NumpadMultiply',
  displayOption: 'FadeInFadeOut',
  allowMouseWheel: true,
  rememberSpeed: false
};

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, (settings) => {
    document.getElementById('speedStep').value = Number(settings.speedStep).toFixed(2);
    document.getElementById('slowerKeyInput').value = settings.slowerKeyCode;
    document.getElementById('fasterKeyInput').value = settings.fasterKeyCode;
    document.getElementById('resetKeyInput').value = settings.resetKeyCode;
    document.getElementById('allowMouseWheel').checked = settings.allowMouseWheel;
    document.getElementById('rememberSpeed').checked = settings.rememberSpeed;

    const radioEl = document.getElementById(settings.displayOption);
    if (radioEl) radioEl.checked = true;
  });
}

function saveSettings() {
  const displayOption = document.querySelector('input[name="displayOption"]:checked');
  const settings = {
    speedStep: parseFloat(document.getElementById('speedStep').value) || DEFAULTS.speedStep,
    slowerKeyCode: document.getElementById('slowerKeyInput').value,
    fasterKeyCode: document.getElementById('fasterKeyInput').value,
    resetKeyCode: document.getElementById('resetKeyInput').value,
    displayOption: displayOption ? displayOption.value : DEFAULTS.displayOption,
    allowMouseWheel: document.getElementById('allowMouseWheel').checked,
    rememberSpeed: document.getElementById('rememberSpeed').checked
  };

  chrome.storage.sync.set(settings, () => {
    showStatus('Options saved');
  });
}

function restoreDefaults() {
  chrome.storage.sync.set(DEFAULTS, () => {
    loadSettings();
    showStatus('Default options restored');
  });
}

function showStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  setTimeout(() => { status.textContent = ''; }, 1500);
}

function populateKeySelects() {
  fetch('keycodedict.json')
    .then(response => response.json())
    .then(data => {
      const selects = ['fasterKeyInput', 'slowerKeyInput', 'resetKeyInput'];
      for (const id of selects) {
        const select = document.getElementById(id);
        select.innerHTML = '';
        for (const entry of data.keys) {
          const option = document.createElement('option');
          option.value = entry.code;
          option.textContent = entry.label;
          select.appendChild(option);
        }
      }
      loadSettings();
    });
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  populateKeySelects();
  document.getElementById('save').addEventListener('click', saveSettings);
  document.getElementById('restore').addEventListener('click', restoreDefaults);
});
