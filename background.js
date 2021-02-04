chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({collection: ['blog','finance']}, function() {
      alert("compile successful");
    });
  });