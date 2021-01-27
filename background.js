chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({collection: ['finance','blog']}, function() {
      console.log("The color is green.");
    });
  });