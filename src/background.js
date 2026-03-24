// MV3 service worker - handle action click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/option/options.html')
  });
});
