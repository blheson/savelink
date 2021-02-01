chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({collection: ['finance','blog']}, function() {
      alert("compile successful");
    });
  });