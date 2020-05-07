(function() {
    var activeTab = chrome.tabs.TAB_ID_NONE;
    var tabStorage = {};
    var cache = {};

    const networkFilters = {
        urls: [
            "<all_urls>"
        ]
    };

    chrome.runtime.onMessage.addListener((msg, sender, response) => {
        switch (msg.type) {
            case 'popupInit':
                response(tabStorage[msg.tabId]);
                break;
            default:
                response('unknown request');
                break;
        }
    });

    function initTabStorage(tabId) {
        // if(tabStorage[tabId]) {
        //     delete tabStorage[tabId].requests;
        //     delete tabStorage[tabId].iiif.manifests;
        //     delete tabStorage[tabId].iiif.images;
        //     delete tabStorage[tabId].iiif.collections;
        //     delete tabStorage[tabId].iiif;
            delete tabStorage[tabId];
        // };
        tabStorage[tabId] = {
            id: tabId,
            requests: {},
            iiif: {
                manifests: {},
                images: {},
                collections: {}
            },
            registerTime: new Date().getTime()
        };
    }

    function compileData(data,url,request,tabId) {
        var iiif = analyzeJSONBody(data,url);
        if(!iiif) {
            return;
        }
        if (!tabStorage.hasOwnProperty(tabId)) {
            initTabStorage(tabId);
        }
        var item = {}
        item.id = data['@id'];
        item.url = url;
        item.cors = request.cors;
        if(iiif.api=="presentation" && iiif.type=="manifest") {
            item.label = data.label;
            item.thumb = data['sequences'][0]['canvases'][0]['images'][0]['resource']['service']['@id']+'/full/100,/0/default.jpg';
        } else if (iiif.api=="image") {
            item.label = url;
            item.thumb = data['@id']+'/full/100,/0/default.jpg';
        } else {
            item.label = url;
            item.thumb = "logo-small.png";
        }
        if(item.label.length>40) {
            item.label=item.label.slice(0,36)+"...";
        }
        if(iiif.type=="manifest") {
            tabStorage[tabId].iiif.manifests[item.id] = item;
        } else if (iiif.type=="collection") {
            tabStorage[tabId].iiif.collections[item.id] = item;
        } else {
            tabStorage[tabId].iiif.images[item.id] = item;
        }
        if(tabId==activeTab) {
            updateIcon(tabId);
        }
    }

    function analyzeJSONBody(body,url) {
        if(!body.hasOwnProperty("@context")) {
            cache[url]=false;
            return(false);
        }

        var ctx = body["@context"].split("/");
        // alert(JSON.stringify(ctx));

        if(ctx[2]!=="iiif.io" || ctx[3]!=="api") {
            cache[url]=false;
            return false;
        }

        var iiif = {
            api: ctx[4].toLowerCase(),
            version: ctx[5].toLowerCase()
        }

        if(body.hasOwnProperty("@type")) {
            iiif.type=body["@type"].split(":")[1].toLowerCase();
        } else {
            iiif.type=false
        }

        return(iiif);
    }

    function updateIcon(tabId) {
        if(tabId==chrome.tabs.TAB_ID_NONE) {
            return;
        }
        var num =
            Object.keys(tabStorage[tabId].iiif.manifests).length+
            Object.keys(tabStorage[tabId].iiif.collections).length+
            Object.keys(tabStorage[tabId].iiif.images).length;
        chrome.runtime.sendMessage({type: 'updateIcon', number: num.toString()});
        chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
        chrome.browserAction.setBadgeText({text:num.toString()});
    }

    function filterURLs(url) { // returns true=block, false=accept
        if(cache[url]===false) {
            // console.log("IGNORED BY CACHE RULE: "+url);
            return true;
        } else if (cache.hasOwnProperty(url)) {
            // console.log("ALLOWING URL BY CACHE: "+url);
            return false;
        }
        // console.log("ANALYZING HOSTNAME: "+url);
        const filter = [
            "google.com", "googleusercontent.com", "gstatic.com", "google.de",
            "twitter.com", "linkedin.com", "paypal.com", "ebay.de",
            "ebay.com", "ebaystatic.com", "ebayimg.com", "googletagservices.com",
            "amazon.de", "amazon.com", "amazon.co.uk", "reddit.com", "facebook.com",
            "yahoo.com", "yahoo.de", "fbcdn.net", "youtube.com", "netflix.com",
            "instagram.com", "twitch.tv"
        ]
        // console.log("matching "+url)
        var hostname = url.match(/^(https?\:)\/\/([^:\/]*)(.*)$/);
        if(!hostname) {
            // console.log("NO REGEX MATCH: "+url);
            return true;
        }
        hostname = hostname[2].split('.');
        hostname = hostname[hostname.length-2]+"."+hostname[hostname.length-1];
        if(filter.includes(hostname)) {
            // console.log("IGNORED BY HOSTNAME, SETTING CACHE RULE: "+url);
            cache[url]=false;
            return true;
        }
        // console.log("GOOD: "+url);
        return false;
    }

    chrome.webRequest.onHeadersReceived.addListener((details) => {
        var { tabId, requestId, url, timeStamp, method } = details;

        if(tabId==chrome.tabs.TAB_ID_NONE) {
            return;
        }

        console.log("URL: "+url);

        // tabId = fixTabId(tabId);

        if(filterURLs(url)) {
            return;
        }

        if (!tabStorage.hasOwnProperty(tabId)) {
            console.log("init tab "+tabId);
            initTabStorage(tabId);
        }

        if (method!="GET") {
            cache[url]=false;
            return;
        }

        var accepted = false;
        var cors = false;

        for (index = 0; index < details.responseHeaders.length; index++) {
            var item=details.responseHeaders[index];
            if(
                item.name.toLowerCase().includes("type") &&
                item.value.toLowerCase().includes("json")
            ) {
                accepted = true;
            }
            if(
                item.name.toLowerCase().includes("access-control-allow-origin") &&
                item.value.toLowerCase().includes("*".toUpperCase())
            ) {
                cors = true;
            }
            if(item.name=="Content-Length" && item.value>1000000) {
                // console.log("discard(2) "+details.url);
                accepted = false;
                cache[url]=false;
                return;
            }
        }

        if (accepted==false) {
            cache[url]=false;
            return;
        }

        tabStorage[tabId].requests[requestId] = {
            requestId: requestId,
            url: details.url,
            startTime: details.timeStamp,
            cors: cors,
            status: 'pending'
        };
        // console.log(tabStorage[tabId].requests[requestId]);
    }, networkFilters, ["responseHeaders"]);

    chrome.webRequest.onCompleted.addListener((details) => {
        var { tabId, requestId, url, timeStamp, method } = details;

        if(tabId==chrome.tabs.TAB_ID_NONE) {
            return;
        }

        if(filterURLs(url)) {
            return;
        }

        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }

        console.debug("DETEKTIIIF CHECKING "+url);

        var request = tabStorage[tabId].requests[requestId];

        Object.assign(request, {
            endTime: details.timeStamp,
            responseHeaders: JSON.stringify(details.responseHeaders),
            requestDuration: details.timeStamp - request.startTime,
            status: 'complete'
        });

        if(cache.hasOwnProperty(url)) {
            console.debug("DETEKTIIIF CACHE HIT: "+url);
            if(cache[url]) {
                compileData(cache[url],url,request,tabId);
                return;
            }
        } else {
            console.debug("DETEKTIIIF CACHE MISS: "+url);
            fetch(url, {cache: "force-cache"})
                .then(res => res.json())
                .then((data) => {
                    cache[url] = data;
                    compileData(data,url,request,tabId);
                })
                .catch((error) => {
                    cache[url]=false;
                    console.debug('Error:', error);
                });
        }

        // console.log(tabStorage[tabId].requests[details.requestId]);

    }, networkFilters, ["responseHeaders"]);

    chrome.tabs.onUpdated.addListener((tabId,changeInfo,tab) => {
        console.log("UPDATE TAB "+tabId)
        if(!changeInfo.url) {
            console.log("NO URL INFO");
            return;
        }
        // alert("UPDATE");
        if(tabId==chrome.tabs.TAB_ID_NONE) {
            return;
        }
        // activeTab=tabId;
        // tabStorage[tabId] = null;
        initTabStorage(tabId);
        updateIcon(tabId);
    });

    chrome.tabs.onActivated.addListener((tab) => {
        // alert("ACTIVATE");
        if(!tab) {
            return;
        }
        const tabId = tab.tabId;
        if(tabId==chrome.tabs.TAB_ID_NONE) {
            return;
        }
        console.log("ACTIVE TAB "+tabId)
        activeTab=tabId;
        if (!tabStorage.hasOwnProperty(tabId)) {
            initTabStorage(tabId);
        }
        updateIcon(tabId);
    });

    chrome.tabs.onRemoved.addListener((tab) => {
        const tabId = tab.tabId;
        if(tabId==chrome.tabs.TAB_ID_NONE) {
            return;
        }
        if (!tabStorage.hasOwnProperty(tabId)) {
            return;
        }
        delete tabStorage[tabId];
    });

}());
