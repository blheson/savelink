chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get('collection', function (result) {
    if (result.collection == null) {
      chrome.storage.sync.set({ collection: ['blog', 'finance'] });
    }
  });
});
chrome.tabs.onActivated.addListener((e) => {

  if (read.allLinks.length < 1)
    read.syncLinks();

  expire = listener.expire()

  if (Object.keys(expire).length > 0) {
    chrome.browserAction.setBadgeText({ 'text': `${Object.keys(expire).length}` });
    chrome.browserAction.setBadgeBackgroundColor({ 'color': `red` });
  }
  else
    chrome.browserAction.setBadgeText({ 'text': '' });

})