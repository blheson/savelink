const background = {
  contextMenu: {
    create: function (contextMenu, callback = null) {
      if (!read.contextMenuIdCache.includes(contextMenu.id)) {
        chrome.contextMenus.create(contextMenu, callback)
        read.contextMenuIdCache.push(contextMenu.id)
      }else{
        alert('already created')
        console.log('already created')
      }
    },
    click: function () {
      chrome.contextMenus.onClicked.addListener(() => {

        chrome.tabs.query({ 'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT },
          function (tabs) {

            let link = tabs[0].url.length > 1 ? tabs[0].url : '';
            //create an alert for no link here
            let title = helper.parseTitle(tabs[0].title)
      
            let collection = 'contextmenu'
            let status = 'urgent'
            let expire_at = helper.parseDate(helper.getFutureDate(2));
             
            let data = {};
            data[title] = {
              collection,
              expire_at,
              link,
              status,
              title
            };
 
            chrome.storage.sync.get('link', (result) => {
              let resultLink = result.link;

              if (typeof resultLink == 'object' && resultLink.hasOwnProperty(title)) {
 
                return
              }
              final = helper.collectiveLink(resultLink, data)
         
              chrome.storage.sync.set({ link: final });
 

            })

          }
        );
      })
    }

  },
  tab: {
    activated: function () {
      chrome.tabs.onActivated.addListener(() => {
        read.syncLinks();
        domData.setBadgeState()
      })
    }
  },
  runtime: {
    onInstalled: () => {
      chrome.runtime.onInstalled.addListener(function () {
        chrome.storage.sync.get('collection', function (result) {
          if (result.collection == null) {
            chrome.storage.sync.set({ collection: ['blog', 'finance', 'contextmenu'] });
          }
        });
      });
    },

    onMessage: () => {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

        if (request.message === 'check_status') {
          // check if user is logged in on chrome
          auth.sendSignInRequest(sendResponse);

        }
        if (request.message === 'save_link_contextmenu') {
          console.log(sender)
        }


        return true;

      })
    }
  }
}

background.contextMenu.create({ 'id': 'addLink', 'title': 'add url' })
background.contextMenu.click();
background.tab.activated();
background.runtime.onInstalled();
background.runtime.onMessage();