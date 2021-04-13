
const init = async () => {
 
    if (Object.keys(read.allLinks).length < 1)
        read.syncLinks();
    //set up collection option
    domData.collectionOption();
    // domData.linkList();
    //get tab link
    chrome.tabs.query({ 'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT },
        function (tabs) {
            let tab = tabs[0]
            read.newLink = tab.url.length > 1 ? tab.url : 'loading...';
            // UI.form.linkPreview.innerText = read.newLink;
            UI.form.linkPreview.value = read.newLink;
            UI.form.saveLink.titleInput.value = tab.title.length > 1 ?
                helper.parseTitle(tab.title) : 'enter a title';

        }
    );
    helper.setFutureDate(1);
    setTimeout(() => {

        if (read.expireListCount() == 0) {
            listener.expire()
        }

        notification.expired()
    }, 500)
}
const notification = {
    expired: () => {

        if (read.expireList) domData.createNotification();
    }
}
const funMessages = [
    'Please wait while the magic goes on', 'It really should not be this long',
    'Do you want to read a joke?',
    'Who looks after our health?',
    'Yea, you guessed right, WHO',
    'Funny right?',
    'Expecting response...'
]
const store = {
    saveCollection: function (data) {

        chrome.storage.sync.get('collection', (result) => {
            let resultCollection = result.collection, final;
            if (typeof resultCollection == 'undefined') {
                final = data
            } else {
                if (resultCollection.includes(data)) {
                    // middleware.collection.info('This collection already exist')
                    middleware.info('This collection already exist')
                    return
                }
                final = resultCollection.concat(data)
            }

            this.setCollection(final);
            domData.collectionOption();
            UI.popDisplay();
        });
    },
    saveLink: function (data) {

        //Check if you are adding new link
        if (read.formStatus == 'new') {
            chrome.storage.sync.get('link', (result) => {
                let resultLink = result.link;
                //does title exist
                if (typeof resultLink == 'object' && resultLink.hasOwnProperty(data[1])) {
                    middleware.info('Title already exist')
                    return
                }
                // final = (typeof resultLink == 'undefined') ? data[0] : Object.assign(resultLink, data[0]);
                final = helper.collectiveLink(resultLink, data[0])
                store.setLink(final);

                middleware.info('Link saved successfully', 'success');
                read.allLinks = final
                domData.setBadgeState();

            });
        } else {
            chrome.storage.sync.get('link', (result) => {
                let resultLink = result.link;

                //does title exist
                if (typeof resultLink == 'object') {
                    delete resultLink[read.currentLinkKey];

                    // final = (typeof resultLink == 'undefined') ? data[0] : Object.assign(resultLink, data[0]);
                    final = helper.collectiveLink(resultLink, data[0])
                    store.setLink(final);

                    middleware.info('Link updated successfully', 'success')
                    read.formStatus = 'new'
                    read.allLinks = final
                    domData.setBadgeState()
                }
            })
        }
        setTimeout(() => {
            //make only search result show    
            update.confirmUpdate();
        }, 50);
    },
    setLink: (data) => {
        chrome.storage.sync.set({ link: data });
    },
    setCollection: (data) => {
        chrome.storage.sync.set({ collection: data });
    }
}
const update = {
    confirmUpdate: () => {

        UI.showList();

        domData.loadSearch()


    }
}

const api = {
    // retrieveEndpoint: 'http://localhost/landing-page/api/retrieve-link.php',
    // syncEndpoint: 'http://localhost/landing-page/api/add-link.php',
    retrieveEndpoint: 'https://businesstosales.com/api/retrieve-link.php',
    syncEndpoint: 'https://businesstosales.com/api/add-link.php',
    syncRequest: function (response) {
        let syncFetch = this.syncFetch
        let prepareSyncRequest = this.prepareSyncRequest
        chrome.storage.sync.get(['link', 'collection'], (result) => {
            let link = JSON.stringify(result.link);
            if (typeof link === 'undefined' || Object.keys(result.link).length < 1) {
                middleware.info('No link available', 'error');
                UI.waitCloudResponse(false)

                return true;
            }
            let request = prepareSyncRequest(link, result.collection, response.message)
            syncFetch(request);
        });

    },
    prepareSyncRequest: function (link, collection, userId) {

        let fd = new FormData();
        fd.append('link', link);
        fd.append('collection', collection);
        fd.append('user', userId);

        let request = new Request(api.syncEndpoint, {
            method: 'post',
            header: {
                'Access-Control-Allow-Origin': api.syncEndpoint
            },
            body: fd
        });
        return request;
    }
    ,
    syncFetch: (request) => {

        fetch(request).then(response => {
            let result = response.json();

            if (response.status !== 200) throw new Error(result.message);
            
            return result;
        }).then(result => {
            if (result.error) throw new Error(result.message);

            middleware.info(result.message, 'success');
            UI.waitCloudResponse(false)

        }).catch(error => {
            if (error == 'TypeError: Failed to fetch') error = 'No internet connection'
            middleware.info(error, 'error');
            UI.waitCloudResponse(false)
        });
    },
    retrieveFetch: (request) => {

        fetch(request).then(response => {

            let result = response.json();
        
            if (response.status !== 200) {throw new Error(result.message);}
         
            return result;
        }).then(result => {

            if (result.error)
                throw new Error(result.message);

 
            let link = JSON.parse(result.message.link);

            let collection = result.message.collection.split(',');
            store.setCollection(collection);
            store.setLink(link);
            middleware.info('retrieve successful', 'success');
            domData.linkList();//reload table
            UI.waitCloudResponse(false)
        }).catch((error) => {

            if (error == 'TypeError: Failed to fetch')
                error = 'No internet connection'
            middleware.info(error, 'error');
            UI.waitCloudResponse(false)
        });
        return true;
    },
    retrieveRequest: function (response) {
        let fd = new FormData();
        fd.append('user', response.message);

        let request = new Request(api.retrieveEndpoint, {
            method: 'post',
            header: {
                'Access-Control-Allow-Origin': api.retrieveEndpoint
            },
            body: fd
        });
        return this.retrieveFetch(request)
    }
}

//UI section
const UI = {
    displayExpireDate: function () {
        if (this.form.saveLink.selectStatus.value.toLowerCase() == 'later') {
            this.form.saveLink.expireBox.style.display = 'none'
            return
        }
        this.form.saveLink.expireBox.style.display = ''
    },
    body: document.querySelector('body'),
    searchInput: document.querySelector("input[name=search]"),
    cloudLogBox: document.querySelector('.cloudLogBox'),
    cloudLogMenu: document.querySelector('.cloudLogMenu'),

    giveInfo: document.querySelector('.giveInfo'),
    showList: function () {
        this.page.linkTable.style.display = "block";
        this.page.linkForm.style.display = "none";
        this.searchInput.classList.remove('d-none')
        document.querySelector(".navBtn.active").classList.remove('active')
        this.menuBtn.showList.classList.add('active')
    },
    waitCloudResponse: function (status) {
        let span;
        if (status) {
            span = document.createElement('span');

            span.classList.add('cloud-loading')
            this.cloudLogBox.appendChild(span)
            this.cloudLogMenu.style.display = 'none';
            span.innerText = 'Expecting response...'
            let i = 0
            setInterval(function () {
                if (i > funMessages.length - 1)
                    i = 0
                span.innerText = funMessages[i]

                i++
            }, 3000)

        } else {
            span = document.querySelector('.cloud-loading')
            this.cloudLogBox.removeChild(span)
            this.cloudLogMenu.style.display = '';
        }

    }
    ,
    menuBtn: {
        showList: document.querySelector(".showList"),
        saveLink: document.querySelector(".backToForm")
    },
    page: {
        linkForm: document.querySelector("#saveLinkForm"),
        linkTable: document.querySelector("#linkList")
    },
    collection: {
        popClose: document.querySelector('.popClose'),
        submitBtn: document.querySelector('.addCollectionBtn')
    },
    backToForm: function () {
        this.page.linkTable.style.display = "none";
        this.page.linkForm.style.display = "block";
        this, this.searchInput.classList.add('d-none');
        document.querySelector(".navBtn.active").classList.remove('active')
        this.menuBtn.saveLink.classList.add('active')
        UI.displayExpireDate()
    },
    notification: {
        info: document.querySelector('.notification')
    },
    cloud: {
        sync: document.querySelector('.sync'),
        retrieve: document.querySelector('.retrieve'),
        logout: document.querySelector('.logout')
    },
    linkTable: {
        table: document.querySelector('table#linkTable'),
        tBody: document.querySelector('.bodyList'),
        clearLink: document.querySelector(".clearLink")
    },
    form: {
        linkPreview: document.querySelector(".linkPreview"),
        saveLink: {
            selectCollection: document.querySelector("select[name=collection"),
            selectStatus: document.querySelector("select[name=status"),
            titleInput: document.querySelector("input[name=title]"),
            expireInput: document.querySelector("input[name=expireAt]"),
            expireBox: document.querySelector(".expireDate"),
            submitBtn: document.querySelector('.submitLinkForm')
        },
        saveCollection: {
            collectionInput: document.querySelector('input[name=newCollection]')
        },

    },

    popDisplay: () => {
        let pop = document.querySelector(".addNewCollectionSection");
        if ('block' == pop.style.display)
            pop.style.display = 'none';
        else
            pop.style.display = 'block'
    },
    popWarn: (warn) => {
        let warnDom = document.querySelector('.warn')
        if ('none' == warnDom.style.display) {
            warnDom.style.display = 'block';
            warnDom.querySelector('.warntext').innerText = warn;
        } else {
            warnDom.style.display = 'none';
            warnDom.querySelector('.warntext').innerText = warn;
        }

    }
}
//get form data section
const processForm = (link) => {
    let linkForm = document.querySelector(".linkForm");
    let collection = linkForm.querySelector("select[name=collection]").value;
    let title = linkForm.querySelector("input[name=title]").value;
    let status = linkForm.querySelector("select[name=status]").value;
    let isLinkStatusLater = status.toLowerCase() == 'later'
    let expire_at = isLinkStatusLater ? '-' : linkForm.querySelector("input[name=expireAt]").value


    //link validation 
    if (!isLinkStatusLater)
        if (expire_at.length < 1 || middleware.dateCheck(expire_at, 1))
            return 'Choose a future date';
    if (title.length < 2)
        return 'Choose a proper title';
    if (collection == 'addNew')
        return 'Choose a proper collection';

    let data = {};
    data[title] = {
        collection,
        expire_at,
        link,
        status,
        title
    };
    return [data, title];
}


//
//########## EVENT LISTENERS ############
//
//show expired link
UI.notification.info.addEventListener('click', (e) => {
    if (e.target.classList.contains('notifyBtn')) {
        read.listTableStatus = 'expire';
        domData.ExpiredLinkList();
        UI.notification.info.innerText = 'Expired Links';
    }
})

//submit link form section
UI.form.saveLink.submitBtn.addEventListener('click', () => {
    if (read.formStatus == 'edit')
        UI.notification.info.innerText = '';
    if (/^(chrome:)/.test(read.newLink)) {
        middleware.info('The URL is invalid')
        return
    }

    let newData = processForm(read.newLink);

    (typeof newData == 'object') ?
        store.saveLink(newData) :
        middleware.info(newData ? newData : 'Please, fill in all fields')
})

//show list of links section
UI.menuBtn.showList.addEventListener("click", () => {

    listener.handleShowListButton()
    UI.form.saveLink.submitBtn.innerText = 'Save Link +';
    UI.form.saveLink.submitBtn.classList.remove('btnPrimary');
    UI.notification.info.innerText = '';
    read.formStatus = 'new'
    // UI.form.linkPreview.innerText = read.newLink
    UI.form.linkPreview.value = read.newLink
    UI.form.saveLink.titleInput.value = ''
    UI.form.saveLink.titleInput.disabled = false

})

//return to form (home)
UI.menuBtn.saveLink.addEventListener("click", () => {
    // listener.showNotification()
    
    UI.backToForm()
 
    notification.expired(listener.expire())
    // read.tableStatus = false

})

UI.linkTable.clearLink.addEventListener("click", () => {
    if (confirm("DELETE ALL LINKS?")) {
        chrome.storage.sync.remove('link', function () {
            read.allLinks = []
            domData.linkList();
            domData.setBadgeState()
        });
    }
})

//save collection form
UI.form.saveLink.selectCollection.addEventListener("change", () => {
    if (UI.form.saveLink.selectCollection.value == 'addNew') {
        //pop up collection   
        UI.popDisplay();
    }
})

//close collection form
UI.collection.popClose.addEventListener('click', () => {
    UI.popDisplay();
    UI.form.saveLink.selectCollection.querySelector('option').selected = true
})

//add a new collection
UI.collection.submitBtn.addEventListener('click', () => {
    let newCollection = UI.form.saveCollection.collectionInput;
    let lowCase = newCollection.value.toLowerCase();
    if (lowCase.length > 1) {
        store.saveCollection(lowCase);
        setTimeout(() => {

            let collectOption = UI.form.saveLink.selectCollection.querySelector(`option[value='${lowCase}']`)
            collectOption.selected = true;

        }, 100);
    } else {
        middleware.info('Select a proper collection name')
    }
})
//Sync Section
UI.cloud.sync.addEventListener('click', () => {
    if (confirm('Sync will add your locally saved data to a third party storage system for backup')) {
        UI.waitCloudResponse(true)
        chrome.runtime.sendMessage({
            message: 'check_status'
        }, (response) => {
       
            if (chrome.runtime.lastError || response.error) {
                middleware.info(response.message, 'error');
                UI.waitCloudResponse(false)

                return;
            }
            api.syncRequest(response);
        })
    }



})
// retrieve section
UI.cloud.retrieve.addEventListener('click', () => {
    if (confirm('Retrieving from a third party cloud backup will overwrite your current locally saved information?')) {
        UI.waitCloudResponse(true)

        chrome.runtime.sendMessage({
            message: 'check_status'
        }, (response) => {
            if (response.error) {
                middleware.info(response.message, 'error');
                UI.waitCloudResponse(false)
                return;
            }
            api.retrieveRequest(response);
        })
    }
})

//logout section
// UI.cloud.logout.addEventListener('click', () => {
//     chrome.storage.sync.remove('user')
//     middleware.info('Successfully logged out', 'success');
// })
//delete and edit link section
UI.linkTable.tBody.addEventListener('click', (e) => {
    let targetDom = e.target;
    let tit = targetDom.parentNode.parentNode.querySelector(".singTitle").innerText;
    /**
     * Delete link
     */
    if (targetDom.classList.contains('singClear') && confirm('Do you want to delete link?')) {
        chrome.storage.sync.get('link', function (result) {
            let link = result.link;
            delete link[tit];
            listener.expireTable(tit);
            store.setLink(link);
            // domData.setUpTable();
            read.allLinks = link;
            domData.setBadgeState();
            //make only search result show
            domData.loadSearch()
        })
    }
    /**
     * Edit link
     */
    if (targetDom.classList.contains('singEdit') && confirm('Do you want to edit link?')) {
        let link = targetDom.parentNode.parentNode.querySelector(".singTitle").href;
        let expire = targetDom.parentNode.parentNode.querySelector(".singDate").innerText;
        let collect = targetDom.parentNode.parentNode.querySelector(".singCollection").innerText;
        let status = targetDom.parentNode.parentNode.querySelector(".singStatus").innerText;

        UI.backToForm();
        // UI.form.linkPreview.innerText = link
        UI.form.linkPreview.value = link
        UI.form.saveLink.titleInput.value = tit
        read.currentLinkKey = tit
        // UI.form.saveLink.titleInput.disabled = true

        let prev = UI.form.saveLink.selectCollection.querySelector(`option[selected=select]`)
        if (prev != null)
            prev.removeAttribute('selected')

        UI.form.saveLink.selectCollection.querySelector(`option[value='${collect}']`).selected = true

        prev = UI.form.saveLink.selectStatus.querySelector(`option[selected=select]`)
        if (prev != null)
            prev.removeAttribute('selected')

        UI.form.saveLink.selectStatus.querySelector(`option[value=${status}]`).selected = true

        read.formStatus = 'edit'

        UI.form.saveLink.expireInput.value = expire;

        UI.notification.info.innerText = 'Edit Link';
        UI.form.saveLink.submitBtn.innerText = 'Edit Link +';
        // UI.form.saveLink.submitBtn.style.backgroundColor = '#3390d9'
        UI.form.saveLink.submitBtn.classList.add('btnPrimary');
    }
})

UI.searchInput.addEventListener('keyup', (e) => {
    // Clear the timeout if it has already been set.
    // This will prevent the previous task from executing
    // if it has been less than <MILLISECONDS>
    clearTimeout(read.timeout);
    read.timeout = setTimeout(() => {
        domData.loadSearch()
    }, 500);
})
UI.form.saveLink.selectStatus.addEventListener('change', () => {
    UI.displayExpireDate();
})


init()