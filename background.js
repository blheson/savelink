const background = {
  notification: () => {
    chrome.storage.sync.get('notify', (result) => {

      notificationDate = parseInt(result.notify);

      if (helper.futureDate == 0) helper.setFutureDate(1)

      //Only make alert once a day
      if (notificationDate > helper.futureDate) {//check for expirelinks
        if (read.allLinks.length < 1)
          read.syncLinks();


        //allow the link syncing before making notification
        setTimeout(() => {
          let listCount = Object.keys(listener.expire()).length
          if (listCount > 0) {
            chrome.storage.sync.set({ notify: helper.futureDate })
            chrome.notifications.create('error', {
              type: 'basic',
              title: 'Expired Link Notification',
              message: `You have ${listCount} expired links in Blim Manager`,
              iconUrl: 'assets/img/blim32.png'
            })
          }

        }, 1000)



      }

    })

  },
  contextMenu: {
    create: function (contextMenu, callback = null) {
      chrome.storage.sync.get('contextMenuIds', ({ contextMenuIds }) => {
        if (typeof contextMenuIds != 'array') contextMenuIds = []

        if (!contextMenuIds.includes(contextMenu.id)) {
          chrome.contextMenus.create(contextMenu, callback)
          contextMenuIds.push(contextMenu.id)
          chrome.storage.sync.set({ contextMenuIds })
        }
      })

    },
    parseLinkData: (tabs) => {
      let link = tabs[0].url.length > 1 ? tabs[0].url : '';
      if (link == '') {
        return;
      }
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
      return [data, title]
    },
    click: function () {
      chrome.contextMenus.onClicked.addListener(() => {

        chrome.tabs.query({
          'active': true,
          'windowId': chrome.windows.WINDOW_ID_CURRENT
        },
          function (tabs) {

            [data, title] = background.contextMenu.parseLinkData(tabs)
            let re = /^(http)/;

            if (!re.test(tabs[0].url)) {
              chrome.notifications.create('error', {
                type: 'basic',
                title: 'Notification',
                message: 'Invalid Url',
                iconUrl: 'assets/img/blim32.png'
              })
              return
            }

            chrome.storage.sync.get('link', (result) => {
              let resultLink = result.link;

              if (typeof resultLink == 'object' && resultLink.hasOwnProperty(title)) {
                chrome.notifications.create('error', {
                  type: 'basic',
                  title: 'Information',
                  message: 'Link already exists',
                  iconUrl: 'assets/img/blim32.png'
                })
                return
              }

              final = helper.collectiveLink(resultLink, data)

              chrome.storage.sync.set({ link: final });

              chrome.notifications.create('success', {
                type: 'basic',
                title: 'Success',
                message: 'Link upload successful',
                iconUrl: 'assets/img/blim32.png'
              })
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
        chrome.storage.sync.set({ notify: helper.setFutureDate() })
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

background.contextMenu.create({ 'id': 'addLink', 'title': 'Add URL' })
background.contextMenu.click();
background.tab.activated();
background.runtime.onInstalled();
background.runtime.onMessage();
background.notification();

