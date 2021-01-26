
const read = {
    getLinks: () => {
        chrome.storage.sync.get(['link'], function (result) {
            console.log(result.link);
        });
        // return resultLink;
    },
    newLink: ''
}
const store = {
    saveLink: (data) => {
          
            chrome.storage.sync.remove('link',function () {
                update.linkList(data);
            });
        // chrome.storage.sync.get(['link'], function (result) {
        //     final = (typeof result.link == 'undefined') ? data : result.link.concat(data);
        //     update.linkList(final);
        // });
    }
}
const update = {
    confirmUpdate: () => {
        domData.linkList();
        UI.showList();
    },
    linkList: (data) => {
        chrome.storage.sync.set({ link: data }, function () {
        });
    },
    fillTable: (tempNode, result) => {
        var fragment = new DocumentFragment();
        if (typeof result == 'undefined' || result.length < 1) {
            return
        }
        result.forEach(element => {
            let template = tempNode.cloneNode(true);
            let a = document.createElement("a");
            a.href = element.link
            a.innerText = element.title
            template.querySelector(".singLink").appendChild(a)
            template.querySelector(".singCollection").innerText = element.collection;
            template.querySelector(".singDate").innerText = element.expire_at;
            fragment.appendChild(template);
        });
        return fragment;
    }
}
const domData = {
    tableRow:()=>{
        let tr = document.createElement("tr");

    },
    linkList: () => {
        chrome.storage.sync.get(['link'], function (result) {
            let res = update.fillTable(document.querySelector(".bodyListRow"), result.link);
        console.log(result.link)
        document.querySelector(".bodyList").innerHTML = '';
            if(typeof res == 'object'){
                  document.querySelector(".bodyList").appendChild(res)
            }else{
                
            }
          
        });
    }
}
const UI = {

    showList: () => {
        document.querySelector("#linkList").style.display = "block";
        document.querySelector("#saveLinkForm").style.display = "none";

    },
    backToForm: () => {
        document.querySelector("#linkList").style.display = "none";
        document.querySelector("#saveLinkForm").style.display = "block";
    }
}
const processForm = (link) => {
    let linkForm = document.querySelector(".linkForm");
    let collection = linkForm.querySelector("select[name=collection]").value;
    let title = linkForm.querySelector("input[name=title]").value;
    let status = linkForm.querySelector("select[name=status]").value;
    let expire_at = linkForm.querySelector("input[name=expire_at]").value;
    if (expire_at.length < 1 || title.length < 2) {
        return false;
    }
    return [{
        collection,
        expire_at,
        link,
        status,
        title
    }]
}

chrome.tabs.query({ 'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT },
    function (tabs) {
        read.newLink = tabs[0].url;
        document.querySelector(".linkPreview").innerText = read.newLink;

    }
);

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

})
//return to form
document.querySelector(".backToForm").addEventListener("click", () => {
    UI.backToForm()
})
document.querySelector(".clearLink").addEventListener("click", () => {
    chrome.storage.sync.clear(function () {
        console.log('clear')
        domData.linkList();
    });
})