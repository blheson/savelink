const read = {
    syncLinks: function () {
        chrome.storage.sync.get('link', (result) => {
            this.allLinks = result.link;
        });
    },
    syncCollections: function () {
        chrome.storage.sync.get('collection', (result) => {
            this.allCollections = result.collection;
        });
    },
    allLinks: []
    ,
    expireList: {},
    formStatus: 'new',//new, when adding new link
    tableStatus: false,//true when link list is active
    allCollections: [],
    getLinks: function () {
        this.syncLinks()
        return this.allLinks;
    },
    getCollections: function () {
        this.syncCollections();
        return this.allCollections;
    },
    newLink: null,
    listTableStatus: 'full',
    timeout : null,
    contextMenuIdCache:[],
    currentLinkKey:''
}
const middleware = {
    infoDom: document.querySelector('.info'),
    info: function (info, status = 'error') {
        this.infoDom.innerText = info;
        this.infoDom.classList.add('fadeOut', status);
        this.clear(this.infoDom, status);
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
    },
    dateCheck: (expire_at,day) => {
       

        if (helper.futureDate < 1)
            helper.setFutureDate(day);
    
        return Date.parse(expire_at) <= helper.futureDate;
    }
}
const helper = {
    futureDate: 0, 
    calcFutureDate:function (day){
        return (new Date()).getTime() + (1000 * 60 * 60 * 24 * day)
    },
    setFutureDate: function (day = 1) {
        this.futureDate = this.calcFutureDate(day)
    },
    getFutureDate: function(day){
        return this.calcFutureDate(day)
    },
    collectiveLink:function(resultLink,link){
        return (typeof resultLink == 'undefined') ? link : Object.assign(resultLink, link);
    },
    parseDate:function(time){
        let date = new Date(time)
        let month = ('0' + (date.getMonth()+1)). slice(-2)
        let day = ('0' + (date.getDate())). slice(-2)
        return `${date.getFullYear()}-${month}-${day}`     
    },
    parseTitle:function(title){
        if(title.length > 40){
              
            let index = title.indexOf(' ', 39)
            index = index > 1 ? index : 40
            title = `${title.substr(0,index)}...`
           

           }
    
           return title
    }
}
/**
 * Work with Dom
 * @return node
 */
const domData = {
    setUpTable: function () {
        if (read.listTableStatus == 'full')
            this.linkList()
        else
            this.ExpiredLinkList();
    },
    setBadgeState: function () {//sync the current expired link to badge
        expire = listener.expire()
        let expiredLinkCount = Object.keys(expire).length;
        if (expiredLinkCount > 0) {
            chrome.browserAction.setBadgeText({ 'text': `${expiredLinkCount}` });
            chrome.browserAction.setBadgeBackgroundColor({ 'color': `red` });
        }
        else
            chrome.browserAction.setBadgeText({ 'text': '' });

      
    },

    tableRow: function () {
        let tr = document.createElement("tr");

        let singLink = this.createTableRow('singLink')

        let singCollection = this.createTableRow('singCollection')

        let singDate = this.createTableRow('singDate')
        let singStatus = this.createTableRow('singStatus')

        let singClear = document.createElement("td");
        let edit = document.createElement("span");
        edit.classList.add('singEdit', 'singIcon');
        edit.innerText = 'i';
        singClear.appendChild(edit);
        let clear = document.createElement("span");
        clear.classList.add('singClear', 'singIcon');
        clear.innerText = 'x';
        singClear.appendChild(clear);

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
    createExpireTable: function () {
        if (read.expireList)
            return this.fillTable(this.tableRow(), read.expireList);

        return '';
    },
    createNotification: function () {
        let listCount = Object.keys(read.expireList).length;
        if (listCount > 0)
            document.querySelector('.notification').innerHTML = `You have ${listCount} expired link(s). <button class="danger btnSm btnDanger notifyBtn">Check it out</button>`;
    },
    ExpiredLinkList: function () {
        UI.linkTable.tBody.innerHTML = '';
        UI.linkTable.tBody.appendChild(this.createExpireTable());
        UI.showList();
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
    fillTable: function (tempNode, result) {

        var fragment = new DocumentFragment();
        if (typeof result == 'undefined' || result.length < 1) {
            return
        }
        return domData.checkObjMany(result, tempNode, fragment);
    },
    appendListResult: function (data) {
        UI.linkTable.tBody.innerHTML = ''
        // document.querySelector(".bodyList").innerHTML = '';
        let res = domData.fillTable(domData.tableRow(), data)
        if (typeof res == 'object') {
            UI.linkTable.tBody.appendChild(res)
            let noLink = UI.giveInfo.querySelector('.noLink')
       
            if (noLink) {
                UI.giveInfo.removeChild(noLink)
            }
            if(UI.linkTable.clearLink.style.display == 'none'){
            UI.linkTable.clearLink.style.display = ''
            }
        } else {
            let div = document.createElement('div');
            div.classList.add('textCenter', 'noLink')
            div.innerText = 'No saved link'
            UI.giveInfo.prepend(div)
            UI.linkTable.clearLink.style.display = 'none'
        }


    }
    ,
    linkList: function () {
        // let fill = this.fillTable;
        let appendListResult = this.appendListResult;
      
        chrome.storage.sync.get('link', (result) => {

            appendListResult(result.link)
         
        });
    },
    searchLinkList: function (data) {
        this.appendListResult(data)
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

const listener = {
    expire: () => {
  
        let links = read.allLinks;
        let storeExpire = {};
        for (const link in links) {
            if (Object.hasOwnProperty.call(links, link)) {
                const element = links[link];
    
                if (middleware.dateCheck(element.expire_at, 1) && element.status == 'urgent'){
                    storeExpire[link] = links[link];   
                }
            }
        }
       
        return storeExpire;
    },
    expireTable: (tit) => {
        if (read.listTableStatus != 'full')
            delete read.expireList[tit];
    },
    showNotification: () => {
        if (Object.keys(read.expireList).length > 0)
            domData.createNotification();
        else
            UI.notification.info.innerText = ''
    },
    handleShowListButton: function () {
        if (!read.tableStatus) {
            domData.linkList();
            read.tableStatus = true
        }
        // domData.linkList();
        // read.tableStatus = true

        UI.showList();
        this.showNotification()
        UI.linkTable.tr = UI.linkTable.tBody.querySelectorAll('.bodyListRow');
        notification.expired(listener.expire())
    }
}

