
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
            document.querySelector(".linkPreview").innerText = read.newLink;
        }
    );
    helper.setFutureDate();
    setTimeout(() => {
        notification.expired(listener.expire())
    }, 500)
}
const notification = {
    expired : (store)=>{
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
    showList: () => {
        document.querySelector("#linkList").style.display = "block";
        document.querySelector("#saveLinkForm").style.display = "none";
        document.querySelector(".navBtn.active").classList.remove('active')
        document.querySelector(".showList").classList.add('active')
    },
    backToForm: () => {
        document.querySelector("#linkList").style.display = "none";
        document.querySelector("#saveLinkForm").style.display = "block";
        document.querySelector(".navBtn.active").classList.remove('active')
        document.querySelector(".backToForm").classList.add('active')
    },
    notification: {
        info: document.querySelector('.notification')
    },
    linkTable: {
        tBody: document.querySelector('.bodyList')
    },
    form: {
        saveLink: {
            selectCollection: document.querySelector("select[name=collection")
        },
        saveCollection: {
            collectionInput: document.querySelector('input[name=newCollection]')
        }
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
document.querySelector('.submitLinkForm').addEventListener('click', () => {
    let newData = processForm(read.newLink);
    if (typeof newData == 'object') {
        chrome.storage.sync.get(['link'], (result) => {
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
        middleware.info(newData ? newData : 'Please, fill in all fields')
    }
})

//show list
document.querySelector(".showList").addEventListener("click", () => {
    listener.handleShowListButton()
})

//return to form (home)
document.querySelector(".backToForm").addEventListener("click", () => {
    listener.showNotification()
    UI.backToForm()
})

document.querySelector(".clearLink").addEventListener("click", () => {
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
document.querySelector('.popClose').addEventListener('click', () => {
    UI.popDisplay();
})

//add a new collection
document.querySelector('.addCollectionBtn').addEventListener('click', () => {
    let newCollection = UI.form.saveCollection.collectionInput;
    let lowCase = newCollection.value.toLowerCase();
    if (lowCase.length > 1) {
        store.saveCollection(lowCase);
        setTimeout(() => {
            document.querySelector("select[name=collection]").querySelectorAll("option").forEach(e => {
                if (lowCase == e.value)
                    e.setAttribute('selected', 'select')
            });
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
})

let cc = (data) => {
    console.log(data)
}
init()