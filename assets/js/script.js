
const read = {
    syncLinks: function () {
        chrome.storage.sync.get(['link'], (result) => {
            this.allLinks = result.link;
        });
    },
    syncCollections: function () {
        chrome.storage.sync.get(['collection'], (result) => {
            this.allCollections = result.collection;
        });
    },
    allLinks: []
    ,
    allCollections: [],
    getLinks: function () {
        this.syncLinks()
        return this.allLinks;
    },
    getCollections: function () {

        this.syncCollections()
        console.log(this.allCollections)
        return this.allCollections;
    },
    newLink: ''
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
/**
 * Work with Dom
 * @return node
 */
const domData = {
    tableRow: function () {
        let tr = document.createElement("tr");

        let singLink = this.createTableRow('singLink')

        let singCollection = this.createTableRow('singCollection')

        let singDate = this.createTableRow('singDate')
        let singStatus = this.createTableRow('singStatus')

        let singClear = document.createElement("td");
        let div = document.createElement("div");
        div.classList.add('singClear');
        div.innerText = 'x';
        singClear.appendChild(div);

        tr.classList.add('bodyListRow');
        tr.append(singLink, singCollection, singStatus, singDate, singClear);
        return tr;
    },
    createTableRow: (className) => {
        let td = document.createElement("td");
        let span = document.createElement("span");
        span.classList.add(className);
        td.classList.add('tableField');
        td.appendChild(span);
        return td
    }
    ,
    collectionOption: function () {
        chrome.storage.sync.get('collection', (result) => {
            let resultCollection = result.collection
         
            if (typeof resultCollection == 'undefined' || resultCollection.length < 1) {
                chrome.storage.sync.set({ collection: ['blog', 'finance'] }, function () {
                    resultCollection = ['blog', 'finance'];
                });

            }
            let fragment = new DocumentFragment();
            resultCollection.sort()
            resultCollection.forEach(element => {
                let option = document.createElement('option');
                option.value = option.innerText = element;

                fragment.appendChild(option)
            });
            this.addOptions(fragment)
        });
    },
    addOptions: (fragment) => {
        UI.form.saveLink.selectCollection.innerHTML = '';
        UI.form.saveLink.selectCollection.prepend(fragment)
        let addNewOption = document.createElement('option');
        addNewOption.value = 'addNew';
        addNewOption.innerText = 'add new +';
        UI.form.saveLink.selectCollection.appendChild(addNewOption)
    },
    linkList: function () {
        let fill = this.fillTable;
        chrome.storage.sync.get(['link'], (result) => {
            document.querySelector(".bodyList").innerHTML = '';
            let res = fill(domData.tableRow(), result.link);

            if (typeof res == 'object')
                document.querySelector(".bodyList").appendChild(res)


        });
    },
    fillTable: function (tempNode, result) {

        var fragment = new DocumentFragment();
        if (typeof result == 'undefined' || result.length < 1) {
            return
        }
        return domData.checkObjMany(result, tempNode, fragment);
    },
    checkObjMany: function (result, tempNode, fragment) {
        let urgentFragment = new DocumentFragment();
        let laterFragment = new DocumentFragment();

        for (var key in result) {
            // if (result.hasOwnProperty(key)) {
            if (result[key].status.toLowerCase() == 'urgent') {
                urgentFragment.appendChild(this.divideTable(tempNode, result, key, fragment));
            } else {
                laterFragment.appendChild(this.divideTable(tempNode, result, key, fragment));
            }
        }
        fragment.append(urgentFragment, laterFragment)
        return fragment;
    },
    divideTable: function (tempNode, result, key, fragment) {
        let template = tempNode.cloneNode(true);
        let a = document.createElement("a");
        a.href = result[key].link;
        a.innerText = result[key].title;
        a.classList.add('singTitle');
        a.setAttribute("target", "_blank");
        template.querySelector(".singLink").appendChild(a);
        template.querySelector(".singCollection").innerText = result[key].collection;
        template.querySelector(".singStatus").innerText = result[key].status;
        template.querySelector(".singDate").innerText = result[key].expire_at;
        fragment.appendChild(template);
        return fragment;
    }
}
const init = () => {
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
const middleware = {
    infoDom: document.querySelector('.info'),
    info: function (info, status = 'error') {
        this.infoDom.innerText = info;
        this.infoDom.classList.add('fadeOut', status);
        this.clear(this.infoDom,status);
    },
    collection: {
        infoDom: document.querySelector('.collectionInfo'),
        info: function (info, status = 'error') {
            this.infoDom.innerText = info;
            this.infoDom.classList.add('fadeOut', status);
            middleware.clear(this.infoDom, status);
        }
    }
    ,
    clear: function (info, status) {
       
        setTimeout(() => {
            info.innerText = '';
            info.classList.remove('fadeOut', status);
        }, 3000);
    }
    ,
    confirm: function (warn) {
        UI.popWarn(warn);
        return true;
    }
}
//get form data
const processForm = (link) => {
    let linkForm = document.querySelector(".linkForm");
    let collection = linkForm.querySelector("select[name=collection]").value;
    let title = linkForm.querySelector("input[name=title]").value;
    let status = linkForm.querySelector("select[name=status]").value;
    let expire_at = linkForm.querySelector("input[name=expire_at]").value;
    let newDate = new Date();
    if (expire_at.length < 1 || Date.parse(expire_at) <= newDate.getTime())
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

//submit link form

document.querySelector(".submitLinkForm").addEventListener("click", () => {
    let newData = processForm(read.newLink);
    if (typeof newData == 'object') {
        // let res = store.saveLink(newData[0], newData[1]);
        chrome.storage.sync.get(['link'], (result) => {
            let resultLink = result.link;
            // if('undefined' == resultLink) {
            //     final = (typeof resultLink == 'undefined') ? newData[0] : Object.assign(resultLink, newData[0]);
            //     store.setLink(final);
            //     update.confirmUpdate();
            //     middleware.info('Link saved successfully', 'success')
            // }
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
        // alrt("Please, fill in all fields");
    }
})
//show list
document.querySelector(".showList").addEventListener("click", () => {
    domData.linkList();
    UI.showList();
    UI.linkTable.tr = UI.linkTable.tBody.querySelectorAll('.bodyListRow');
})

//return to form
document.querySelector(".backToForm").addEventListener("click", () => {
    UI.backToForm()
})
document.querySelector(".clearLink").addEventListener("click", () => {
    if (confirm("DELETE ALL LINKS?")) {
        chrome.storage.sync.remove('link', function () {
            domData.linkList();
        });
    }
})
UI.form.saveLink.selectCollection.addEventListener("change", () => {
    if (UI.form.saveLink.selectCollection.value == 'addNew') {
        //pop up collection   
        UI.popDisplay();
    }
})
document.querySelector(".popClose").addEventListener("click", () => {
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

document.querySelector('.bodyList').addEventListener('click', (e) => {
    let targetDom = e.target;
    let tit = targetDom.parentNode.parentNode.querySelector(".singTitle").innerText;
    if (targetDom.classList.contains('singClear') && confirm('Do you want to delete link?')) {
        chrome.storage.sync.get('link', function (result) {
            let link = result.link;
            delete link[tit];
            store.setLink(link)
            domData.linkList();
        })
    }
})

let cc = (data) => {
    console.log(data)
}
init()