
const init = async () => {

    if (read.allLinks.length < 1)
        read.syncLinks();
    //set up collection option
    domData.collectionOption();
    domData.linkList();
    //get tab link
    chrome.tabs.query({ 'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT },
        function (tabs) {
            read.newLink = tabs[0].url.length > 1 ? tabs[0].url : 'loading...';
            UI.form.linkPreview.innerText = read.newLink;
        }
    );
    helper.setFutureDate();
    setTimeout(() => {
        notification.expired(listener.expire())
    }, 500)
}
const notification = {
    expired: (store) => {
        if (store) {
            read.expireList = store
            domData.createNotification();
        }
    }
}

const store = {
    saveCollection: function (data) {

        chrome.storage.sync.get(['collection'], (result) => {
            let resultCollection = result.collection, final;
            if (typeof resultCollection == 'undefined') {
                final = data
            } else {
                if (resultCollection.includes(data)) {
                    middleware.collection.info('This collection already exist')
                    return
                }
                final = resultCollection.concat(data)
            }

            this.setCollection(final);
            domData.collectionOption();
            UI.popDisplay();
        });
    },
    setLink: (data) => {
        chrome.storage.sync.set({ link: data }, function () {
        });
    },
    setCollection: (data) => {
        chrome.storage.sync.set({ collection: data }, function () {
        });
    }
}
const update = {
    confirmUpdate: () => {
        domData.linkList();
        UI.showList();
    }
}



//UI section
const UI = {
    searchInput: document.querySelector("input[name=search]"),

    showList: function () {
        this.page.linkTable.style.display = "block";
        this.page.linkForm.style.display = "none";
        this.searchInput.classList.remove('d-none')
        document.querySelector(".navBtn.active").classList.remove('active')
        this.menuBtn.showList.classList.add('active')
    },
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
    },
    notification: {
        info: document.querySelector('.notification')
    },
    linkTable: {
        tBody: document.querySelector('.bodyList'),
        clearLink: document.querySelector(".clearLink")
    },
    form: {
        linkPreview: document.querySelector(".linkPreview"),
        saveLink: {
            selectCollection: document.querySelector("select[name=collection"),
            selectStatus: document.querySelector("select[name=status"),
            titleInput: document.querySelector("input[name=title]"),
            expireInput: document.querySelector("input[name=expire_at]"),
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
    let expire_at = linkForm.querySelector("input[name=expire_at]").value;

    //link validation 
    // if (expire_at.length < 1 || middleware.dateCheck(expire_at))
    //     return 'Choose a future date';
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

    let newData = processForm(read.newLink);

    if (typeof newData == 'object') {
        //Check if you are adding new link
        if (read.formStatus == 'new') {
            chrome.storage.sync.get('link', (result) => {
                let resultLink = result.link;
                //does title exist
                if (typeof resultLink == 'object' && resultLink.hasOwnProperty(newData[1])) {
                    middleware.info('Title already exist')
                } else {
                    final = (typeof resultLink == 'undefined') ? newData[0] : Object.assign(resultLink, newData[0]);
                    store.setLink(final);
                    update.confirmUpdate();
                    middleware.info('Link saved successfully', 'success');
                    read.allLinks = final
                    domData.setBadgeState();
                }
            });
        } else {
            chrome.storage.sync.get('link', (result) => {
                let resultLink = result.link;

                //does title exist
                if (typeof resultLink == 'object') {
                    delete resultLink[newData[0].title];

                    final = (typeof resultLink == 'undefined') ? newData[0] : Object.assign(resultLink, newData[0]);
                    store.setLink(final);
                    update.confirmUpdate();
                    middleware.info('Link updated successfully', 'success')
                    read.formStatus = 'new'
                    read.allLinks = final
                    domData.setBadgeState();
                }
            })
        }
    } else {
        middleware.info(newData ? newData : 'Please, fill in all fields')
    }

})

//show list of links section
UI.menuBtn.showList.addEventListener("click", () => {
    listener.handleShowListButton()
    UI.form.saveLink.submitBtn.innerText = 'Save Link +';
    UI.form.saveLink.submitBtn.classList.remove('btnPrimary');
    UI.notification.info.innerText = '';
    read.formStatus = 'new'
    UI.form.linkPreview.innerText = read.newLink
    UI.form.saveLink.titleInput.value = ''
    UI.form.saveLink.titleInput.disabled = false

})

//return to form (home)
UI.menuBtn.saveLink.addEventListener("click", () => {
    // listener.showNotification()
    UI.backToForm()
    notification.expired(listener.expire())
})

UI.linkTable.clearLink.addEventListener("click", () => {
    if (confirm("DELETE ALL LINKS?")) {
        chrome.storage.sync.remove('link', function () {
            domData.linkList();
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
document.querySelector('.sync').addEventListener('click',()=>{
    console.log('seen')
    chrome.storage.sync.get(['link', 'collection'], (result) => {
    let fd = new FormData();
    fd.append('link',JSON.stringify(result.link));
    fd.append('collection',result.collection);
    $request = new Request(`http://localhost/landing-page/api/add-link.php`, {
        method: 'post',
        header:{
            'Access-Control-Allow-Origin': 'http://localhost/landing-page/api/add-link.php'
        },
        body: fd
    })
    fetch($request);
})
})


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
            domData.setUpTable();
            read.allLinks = link;
            domData.setBadgeState();
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
        UI.form.linkPreview.innerText = link
        UI.form.saveLink.titleInput.value = tit
        UI.form.saveLink.titleInput.disabled = true

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
let timeout = null;
UI.searchInput.addEventListener('keyup', (e) => {
    // Clear the timeout if it has already been set.
    // This will prevent the previous task from executing
    // if it has been less than <MILLISECONDS>
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        let cache = {};
        let search = UI.searchInput.value.toLowerCase()
        let allLinks = read.allLinks

        for (const key in allLinks) {
            if (Object.hasOwnProperty.call(allLinks, key)) {
                const element = read.allLinks[key];
                if (key.toLowerCase().includes(search) || element.collection.toLowerCase().includes(search))
                    cache[key] = element;
            }
        }

        // cache = allLinks
        domData.searchLinkList(cache)
    }, 500);
})

let cc = (data) => {
    console.log(data)
}
init()