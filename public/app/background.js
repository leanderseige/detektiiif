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
        console.log(tabStorage[tabId].requests[details.requestId]);
    }, networkFilters, ["responseHeaders"]);

    // chrome.webRequest.onErrorOccurred.addListener((details) => {
    //     const {
    //         tabId,
    //         requestId
    //     } = details;
    //     if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
    //         return;
    //     }
    //
    //     const request = tabStorage[tabId].requests[requestId];
    //     Object.assign(request, {
    //         endTime: details.timeStamp,
    //         status: 'error',
    //     });
    //     console.log(tabStorage[tabId].requests[requestId]);
    // }, networkFilters);

    chrome.tabs.onActivated.addListener((tab) => {
        const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
        if (!tabStorage.hasOwnProperty(tabId)) {
            tabStorage[tabId] = {
                id: tabId,
                requests: {},
                registerTime: new Date().getTime()
            };
        }
    });

    // chrome.tabs.onRemoved.addListener((tab) => {
    //     const tabId = tab.tabId;
    //     if (!tabStorage.hasOwnProperty(tabId)) {
    //         return;
    //     }
    //     tabStorage[tabId] = null;
    // });

}());
