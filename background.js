chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get('collection', function (result) {
    if (result.collection == null) {
      chrome.storage.sync.set({ collection: ['blog', 'finance'] });
    }
  });
});
chrome.tabs.onActivated.addListener(() => {


    read.syncLinks();
  domData.setBadgeState()
})


