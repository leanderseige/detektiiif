(function() {
    const tabStorage = {};
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

    function analyzeBody(body) {
        if(!body.hasOwnProperty("@context"))
            return(false);

        var ctx = body["@context"].split("/");
        // alert(JSON.stringify(ctx));

        if(ctx[2]!=="iiif.io" || ctx[3]!=="api")
            return false;

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
        const {
            tabId,
            requestId
        } = details;
        if (!tabStorage.hasOwnProperty(tabId)) {
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
                accepted = false;
                return;
            }
        }

        if (accepted==false) {
            return;
        }

        tabStorage[tabId].requests[requestId] = {
            requestId: requestId,
            url: details.url,
            startTime: details.timeStamp,
            status: 'pending'
        };
        console.log(tabStorage[tabId].requests[requestId]);
    }, networkFilters, ["responseHeaders"]);

    chrome.webRequest.onCompleted.addListener((details) => {
        const {
            tabId,
            requestId
        } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }

        const request = tabStorage[tabId].requests[requestId];

        Object.assign(request, {
            endTime: details.timeStamp,
            responseHeaders: JSON.stringify(details.responseHeaders),
            requestDuration: details.timeStamp - request.startTime,
            status: 'complete'
        });

        const {url, requestDuration, status, responseHeaders} = request;
        fetch(url)
            .then(res => res.json())
            .then((data) => {
                var iiif = analyzeBody(data);
                if(!iiif)
                    return;
                var item = {}
                item.id = data['@id'];
                item.url = url;
                item.label = url; // data.label;
                if(iiif.api=="presentation") {
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
            })
        .catch(console.log)
        console.log(tabStorage[tabId].requests[details.requestId]);
    }, networkFilters, ["responseHeaders"]);

    chrome.tabs.onActivated.addListener((tab) => {
        const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
        if (!tabStorage.hasOwnProperty(tabId)) {
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
        updateIcon(tabId);
    });

}());
