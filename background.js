const background = {
  contextMenu: {
    create: function (contextMenu, callback = null) {
      if (!read.contextMenuIdCache.includes(contextMenu.id)) {
        chrome.contextMenus.create(contextMenu, callback)
        read.contextMenuIdCache.push(contextMenu.id)

      }
    },
    click: function () {
      chrome.contextMenus.onClicked.addListener(() => {

        chrome.tabs.query({ 'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT },
          function (tabs) {

            let newLink = tabs[0].url.length > 1 ? tabs[0].url : 'loading...';
            // console.log(newLink)
            console.log(tabs[0].title)

          }
        );
      })
    }

  },
  tab:{
    activated:function(){
      chrome.tabs.onActivated.addListener(() => {
        read.syncLinks();
        domData.setBadgeState()
      })
    }
  },
  runtime:{
    onInstalled:()=>{
      chrome.runtime.onInstalled.addListener(function () {
        chrome.storage.sync.get('collection', function (result) {
          if (result.collection == null) {
            chrome.storage.sync.set({ collection: ['blog', 'finance'] });
          }
        });
      });
    }
  }
}

background.contextMenu.create({ 'id': 'addLink', 'title': 'add url' })
background.contextMenu.click();
background.tab.activated();
background.runtime.onInstalled();