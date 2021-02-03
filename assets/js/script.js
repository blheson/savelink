
const read = {
    getLinks: () => {
        chrome.storage.sync.get(['link'], function (result) {

        });
        // return resultLink;
    },
    newLink: ''
}
const store = {
    _saveLink: function (data, title) {
        // chrome.storage.sync.get(['link'], (result) => {
        //     //does title exist
        //     if (result.link.hasOwnProperty(title)) {
        //         return false;
        //     } else {
        //         final = (typeof result.link == 'undefined') ? data : Object.assign(result.link, data);
        //         this.setLink(final);

        //         return true;
        //     }
        // });
    },
    get saveLink() {
        return this._saveLink;
    },
    set saveLink(value) {
        this._saveLink = value;
    },
    saveCollection: function (data) {
        chrome.storage.sync.get(['collection'], (result) => {
            let collection = result.collection, final;
            if (typeof collection == 'undefined') {
                final = data
            } else {
                if (collection.includes(data)) {
                    middleware.info('Collection exist')

                    // alrt('collection exists')
                    return
                }
                final = collection.concat(data)
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
    tableRow: () => {
        let tr = document.createElement("tr");

        let singLink = document.createElement("td");
        let span = document.createElement("span");
        span.classList.add('singLink');
        singLink.classList.add('tableField');
        singLink.appendChild(span)

        let singCollection = document.createElement("td");
        span = document.createElement("span");
        span.classList.add('singCollection');
        singCollection.classList.add('tableField');
        singCollection.appendChild(span);

        let singDate = document.createElement("td");
        span = document.createElement("span");
        span.classList.add('singDate');
        singDate.classList.add('tableField');

        singDate.appendChild(span);
        let singClear = document.createElement("td");
        let div = document.createElement("div");
        div.classList.add('singClear');
        div.innerText = 'x';
        singClear.appendChild(div);

        tr.classList.add('bodyListRow');
        tr.append(singLink, singCollection, singDate, singClear);
        return tr;
    },
    collectionOption: function () {
        chrome.storage.sync.get('collection', (result) => {
            if (typeof result == 'undefined' || result.collection.length < 1) {
                chrome.storage.sync.set({ collection: ['finance', 'blog'] }, function () {
                    result.collection = ['finance', 'blog'];
                });

            }
            let fragment = new DocumentFragment();
            result.collection.forEach(element => {
                let option = document.createElement('option');
                // let button = document.createElement('button');
                // button.innerText='x';
                // option.appendChild(button)
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
            if (typeof res == 'object') {
                document.querySelector(".bodyList").appendChild(res)
            } else {
                document.querySelector(".bodyList").innerHTML = 'No saved link';
            }

        });
    },
    fillTable: function (tempNode, result) {

        var fragment = new DocumentFragment();
        if (typeof result == 'undefined' || result.length < 1) {
            return
        }
        // let element = s(result);
        return domData.checkObj(result, tempNode, fragment);
    },
    checkObj: (result, tempNode, fragment) => {

        for (var key in result) {
            if (result.hasOwnProperty(key)) {

                let template = tempNode.cloneNode(true);
                let a = document.createElement("a");
                a.href = result[key].link
                a.innerText = result[key].title;
                a.classList.add('singTitle');
                a.setAttribute("target", "_blank")
                template.querySelector(".singLink").appendChild(a)
                template.querySelector(".singCollection").innerText = result[key].collection;
                template.querySelector(".singDate").innerText = result[key].expire_at;
                fragment.appendChild(template);
            }
        }
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
    popWarn: (warn)=>{
       let warnDom = document.querySelector('.warn')
        if('none'== warnDom.style.display){
            warnDom.style.display = 'block';
            warnDom.querySelector('.warntext').innerText = warn;
        }else{
            warnDom.style.display = 'none';
            warnDom.querySelector('.warntext').innerText = warn;
        }
        
    }
}
const middleware = {
    infoDom : document.querySelector('.info'),
    info: function (info,status='error') {
        this.infoDom.innerText = info;
        this.infoDom.classList.add('fadeOut', status);
        this.clear(status);
    }
    ,
    clear: function (status) {
        let info = this.infoDom;
        setTimeout(() => {
            info.innerText = '';
            this.infoDom.classList.remove('fadeOut', status);
        }, 3000);
    }
    ,
    confirm: function(warn){
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
            //does title exist
            if (result.link.hasOwnProperty(newData[1])) {
                middleware.info('Title already exist')
                // alrt('Title already exist')
            } else {
                final = (typeof result.link == 'undefined') ? newData[0] : Object.assign(result.link, newData[0]);
                store.setLink(final);
                update.confirmUpdate();
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
        chrome.storage.sync.clear(function () {
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
document.querySelector('.addCollectionBtn').addEventListener('click', () => {
    let newCollection = UI.form.saveCollection.collectionInput;
    let col = newCollection.value;
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
        middleware.info('Proper collection name needed')
    }
    // alrt('Proper collection name needed')
})

document.querySelector('.bodyList').addEventListener('click', (e) => {
    let targetDom = e.target;
    let tit = targetDom.parentNode.parentNode.querySelector(".singTitle").innerText;
    if (targetDom.classList.contains('singClear') && confirm('Delete?')) {
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

// function collectdata() {
//     chrome.storage.sync.get('oldLink', function (result) {
//         
//         // result.link;
//         // chrome.storage.sync.set({ oldLink: result.link }, function (params) {

//         // })
//     })
// }
// collectdata()
function s(o, obj) {
    for (var i in o) {
        if (o.hasOwnProperty(i)) {
            return o[i]
        }
    }

}
init()