
const init = async () => {

    if (read.allLinks.length < 1)
        read.syncLinks();
    //set up collection option
    domData.collectionOption();
    domData.linkList();
    //get tab link
    chrome.tabs.query({ 'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT },
        function (tabs) {
            read.newLink = tabs[0].url;
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
    showList: function(){
        this.page.linkTable.style.display = "block";
        this.page.linkForm.style.display = "none";
        document.querySelector(".navBtn.active").classList.remove('active')
        this.menuBtn.showList.classList.add('active')
    },
    menuBtn: {
        showList:document.querySelector(".showList"),
        saveLink:document.querySelector(".backToForm")
    },
    page:{
        linkForm:document.querySelector("#saveLinkForm"),
        linkTable:document.querySelector("#linkList")
    },
    collection:{
        popClose: document.querySelector('.popClose'),
        submitBtn: document.querySelector('.addCollectionBtn')
    },
    backToForm: function () {
        this.page.linkTable.style.display = "none";
        this.page.linkForm.style.display = "block";
        document.querySelector(".navBtn.active").classList.remove('active')
        this.menuBtn.saveLink.classList.add('active')
    },
    notification: {
        info: document.querySelector('.notification')
    },
    linkTable: {
        tBody: document.querySelector('.bodyList'),
        clearLink:document.querySelector(".clearLink")
    },
    form: {
        linkPreview: document.querySelector(".linkPreview"),
        saveLink: {
            selectCollection: document.querySelector("select[name=collection"),
            selectStatus: document.querySelector("select[name=status"),
            titleInput: document.querySelector("input[name=title]"),
            expireInput: document.querySelector("input[name=expire_at]"),
            submitBtn : document.querySelector('.submitLinkForm')
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
//get form data
const processForm = (link) => {
    let linkForm = document.querySelector(".linkForm");
    let collection = linkForm.querySelector("select[name=collection]").value;
    let title = linkForm.querySelector("input[name=title]").value;
    let status = linkForm.querySelector("select[name=status]").value;
    let expire_at = linkForm.querySelector("input[name=expire_at]").value;
    if (expire_at.length < 1 || middleware.dateCheck(expire_at))
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
//show expired link
UI.notification.info.addEventListener('click', (e) => {
    if (e.target.classList.contains('notifyBtn')) {
        read.listTableStatus = 'expire';
        domData.ExpiredLinkList();
        UI.notification.info.innerText = 'Expired Links';
    }
})

//submit link form
UI.form.saveLink.submitBtn.addEventListener('click', () => {

    let newData = processForm(read.newLink);

    if (typeof newData == 'object') {
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
                    middleware.info('Link saved successfully', 'success')
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
                    middleware.info('Link saved successfully', 'success')
                    read.formStatus = 'new'
                    read.allLinks = ''
                }
            })
        }
    } else {
        middleware.info(newData ? newData : 'Please, fill in all fields')
    }

})

//show list
UI.menuBtn.showList.addEventListener("click", () => {
    listener.handleShowListButton()
    UI.form.saveLink.submitBtn.innerText = 'Save Link +';
    UI.notification.info.innerText = '';
    read.formStatus = 'new'
    UI.form.linkPreview.innerText = read.newLink
    UI.form.saveLink.titleInput.value = ''
    UI.form.saveLink.titleInput.disabled = false
})

//return to form (home)
UI.menuBtn.saveLink.addEventListener("click", () => {
    listener.showNotification()
    UI.backToForm()
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
           
           UI.form.saveLink.selectCollection.querySelector(`option[selected=select]`).removeAttribute('selected')

            collectOption.selected = true;
        
        }, 100);
    } else {
        middleware.info('Select a proper collection name')
    }
})

//delete link
UI.linkTable.tBody.addEventListener('click', (e) => {
    let targetDom = e.target;
    let tit = targetDom.parentNode.parentNode.querySelector(".singTitle").innerText;
    if (targetDom.classList.contains('singClear') && confirm('Do you want to delete link?')) {
        chrome.storage.sync.get('link', function (result) {
            let link = result.link;
            delete link[tit];
            listener.expireTable(tit);
            store.setLink(link);
            domData.setUpTable();
        })
    }
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
        if(prev != null)
        prev.removeAttribute('selected')

        UI.form.saveLink.selectCollection.querySelector(`option[value='${collect}']`).selected= true
        
        prev = UI.form.saveLink.selectStatus.querySelector(`option[selected=select]`)
        if(prev != null)
        prev.removeAttribute('selected')

        UI.form.saveLink.selectStatus.querySelector(`option[value=${status}]`).selected= true
        
        read.formStatus = 'edit'
        UI.form.saveLink.expireInput.value = expire;

        UI.notification.info.innerText = 'Edit Link';
        UI.form.saveLink.submitBtn.innerText = 'Edit Link +'
    }
})

let cc = (data) => {
    console.log(data)
}
init()