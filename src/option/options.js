const DEFAULTS = {
  speedStep: 0.25,
  slowerKeyCode: 'NumpadSubtract,Minus',
  fasterKeyCode: 'NumpadAdd,Equal',
  resetKeyCode: 'NumpadMultiply',
  displayOption: 'FadeInFadeOut',
  allowMouseWheel: true,
  rememberSpeed: false
};

function getSelectedValues(select) {
  return Array.from(select.selectedOptions).map(o => o.value).join(',');
}

function setSelectedValues(select, csv) {
  const codes = csv.split(',');
  for (const option of select.options) {
    option.selected = codes.includes(option.value);
  }
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, (settings) => {
    document.getElementById('speedStep').value = Number(settings.speedStep).toFixed(2);
    setSelectedValues(document.getElementById('slowerKeyInput'), settings.slowerKeyCode);
    setSelectedValues(document.getElementById('fasterKeyInput'), settings.fasterKeyCode);
    setSelectedValues(document.getElementById('resetKeyInput'), settings.resetKeyCode);
    document.getElementById('allowMouseWheel').checked = settings.allowMouseWheel;
    document.getElementById('rememberSpeed').checked = settings.rememberSpeed;

    const radioEl = document.getElementById(settings.displayOption);
    if (radioEl) radioEl.checked = true;
  });
}

function saveSettings() {
  const displayOption = document.querySelector('input[name="displayOption"]:checked');
  const slowerKeyCode = getSelectedValues(document.getElementById('slowerKeyInput'));
  const fasterKeyCode = getSelectedValues(document.getElementById('fasterKeyInput'));
  const resetKeyCode = getSelectedValues(document.getElementById('resetKeyInput'));

  if (!slowerKeyCode || !fasterKeyCode || !resetKeyCode) {
    showStatus('Please select at least one key for each action');
    return;
  }

  const settings = {
    speedStep: parseFloat(document.getElementById('speedStep').value) || DEFAULTS.speedStep,
    slowerKeyCode,
    fasterKeyCode,
    resetKeyCode,
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
