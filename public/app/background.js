(function() {
    var currentTabId = false;
    const tabStorage = {};
    const cache = {};
    const networkFilters = {
        urls: [
            "<all_urls>"
        ]
    };

    chrome.runtime.onMessage.addListener((msg, sender, response) => {
        switch (msg.type) {
            case 'popupInit':
                // response(tabStorage[msg.tabId]);
                response(tabStorage[currentTabId]);
                break;
            default:
                response('unknown request');
                break;
        }
    });

    function initTab(tabId) {
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

    function compileData(data,url) {
        var tabId = currentTabId;
        var iiif = analyzeBody(data,url);
        if(!iiif)
            return;
        var item = {}
        item.id = data['@id'];
        item.url = url;
        item.label = url; // data.label;
        if(iiif.api=="presentation" && iiif.type=="manifest") {
            item.thumb = data['sequences'][0]['canvases'][0]['images'][0]['resource']['service']['@id']+'/full/200,/0/default.jpg';
        } else if (iiif.api=="image") {
            item.thumb = data['@id']+'/full/200,/0/default.jpg';
        } else {
            item.thumb = "logo-small.png";
        }
        if(iiif.type=="manifest") {
            tabStorage[tabId].iiif.manifests[item.id] = item;
        } else {
            tabStorage[tabId].iiif.images[item.id] = item;
        }
        updateIcon(tabId);
    }

    function analyzeBody(body,url) {
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
        var num =
            Object.keys(tabStorage[tabId].iiif.manifests).length+
            Object.keys(tabStorage[tabId].iiif.images).length;
        chrome.runtime.sendMessage({type: 'updateIcon', number: num.toString()});
        chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
        chrome.browserAction.setBadgeText({text:num.toString()});
    }

    chrome.webRequest.onHeadersReceived.addListener((details) => {
        // const {
        //     tabId,
        //     requestId
        // } = details;

        var tabId = currentTabId;
        var requestId = details.requestId;

        // alert(JSON.stringify(details));

        // console.log("prechecking "+details.url);

        if(tabId==chrome.tabs.TAB_ID_NONE) {
            console.log(".TAB_ID_NONE");
            return;
        }

        if (!tabStorage.hasOwnProperty(tabId)) {
            // console.log("discard(1) "+details.url);
            // return;
            console.log("init tab "+tabId);
            initTab(tabId);
        }

        if (details.method!="GET") {
            cache[details.url]=false;
            return;
        }

        var accepted = false;

        for (index = 0; index < details.responseHeaders.length; index++) {
            var item=details.responseHeaders[index];
            if(
                item.name.toUpperCase().includes("type".toUpperCase()) &&
                item.value.toUpperCase().includes("json".toUpperCase())
            ) {
                accepted = true;
            }
            if(item.name=="Content-Length" && item.value>1000000) {
                // console.log("discard(2) "+details.url);
                accepted = false;
                return;
            }
        }

        if (accepted==false) {
            cache[details.url]=false;
            return;
        }

        tabStorage[tabId].requests[requestId] = {
            requestId: requestId,
            url: details.url,
            startTime: details.timeStamp,
            status: 'pending'
        };
        // console.log(tabStorage[tabId].requests[requestId]);
    }, networkFilters, ["responseHeaders"]);

    chrome.webRequest.onCompleted.addListener((details) => {
        // const {
        //     tabId,
        //     requestId
        // } = details;

        var tabId = currentTabId;
        var requestId = details.requestId;

        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }

        console.log("checking "+details.url);

        var request = tabStorage[tabId].requests[requestId];

        Object.assign(request, {
            endTime: details.timeStamp,
            responseHeaders: JSON.stringify(details.responseHeaders),
            requestDuration: details.timeStamp - request.startTime,
            status: 'complete'
        });

        const {url, requestDuration, status, responseHeaders} = request;

        if(cache.hasOwnProperty(url)) {
            console.log("CACHE HIT: "+url);
            if(cache[url]) {
                compileData(cache[url],url);
            }
        } else {
            console.log("CACHE MISS: "+url);
            fetch(url, {cache: "force-cache"})
                .then(res => res.json())
                .then((data) => {
                    cache[url] = data;
                    compileData(data,url);
                })
                .catch((error) => {
                    cache[url]=false;
                    console.error('Error:', error);
                });
        }

        // console.log(tabStorage[tabId].requests[details.requestId]);

    }, networkFilters, ["responseHeaders"]);

    chrome.tabs.onActivated.addListener((tab) => {
        // alert(JSON.stringify(tab));
        const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
        currentTabId = tabId;
        if (!tabStorage.hasOwnProperty(tabId)) {
            initTab(tabId);
        }
        updateIcon(tabId);
    });

}());
