
const read = {
    getLinks: () => {
        chrome.storage.sync.get(['link'], function (result) {

        });
        // return resultLink;
    },
    newLink: ''
}
const store = {
    _saveLink: function (data) {
        chrome.storage.sync.get(['link'], (result) => {
            final = (typeof result.link == 'undefined') ? data : Object.assign(result.link, data);
            this.setLink(final);
        });
    },
    get saveLink() {
        return this._saveLink;
    },
    set saveLink(value) {
        this._saveLink = value;
    },
    saveCollection: function (data) {
        chrome.storage.sync.get(['collection'], (result) => {
            final = (typeof result.collection == 'undefined') ? data : result.collection.concat(data);
            this.setCollection(final);
            domData.collectionOption();
            UI.showPop();
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
    },
    backToForm: () => {
        document.querySelector("#linkList").style.display = "none";
        document.querySelector("#saveLinkForm").style.display = "block";
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

    showPop: () => {
        let pop = document.querySelector(".addNewCollectionSection");
        if ('block' == pop.style.display)
            pop.style.display = 'none';
        else
            pop.style.display = 'block'
    }
}

//get form data
const processForm = (link) => {
    let linkForm = document.querySelector(".linkForm");
    let collection = linkForm.querySelector("select[name=collection]").value;
    let title = linkForm.querySelector("input[name=title]").value;
    let status = linkForm.querySelector("select[name=status]").value;
    let expire_at = linkForm.querySelector("input[name=expire_at]").value;
    if (expire_at.length < 1 || title.length < 2) {
        return false;
    }
    let data = {}
    data[title] = {
        collection,
        expire_at,
        link,
        status,
        title
    };
    return data;
}

//submit link form

document.querySelector(".submitLinkForm").addEventListener("click", () => {
    let newData = processForm(read.newLink);
    if (newData) {
        store.saveLink(newData);

        setTimeout(() => {
            update.confirmUpdate();
        }, 100);

    } else alert("Please, fill in all fields");
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
        UI.showPop();
    }
})
document.querySelector(".popClose").addEventListener("click", () => {
    UI.showPop();
})
document.querySelector('.addCollectionBtn').addEventListener('click', () => {
    let newCollection = UI.form.saveCollection.collectionInput;
    if (newCollection.value.length > 1) {
        store.saveCollection(newCollection.value);
        UI.form.saveLink.selectCollection.value = newCollection.value
    } else
        alert('Proper collection name needed')
})

document.querySelector('.bodyList').addEventListener('click', (e) => {
    let targetDom = e.target;
    let tit = targetDom.parentNode.parentNode.querySelector(".singTitle").innerText;
    // cc()
    // cc(targetDom)
    // cc(tit);
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