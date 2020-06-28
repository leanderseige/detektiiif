(function() {
    var activeTab = chrome.tabs.TAB_ID_NONE;
    var tabStorage = {};
    var cache = {};
    var cache_cors = {};
    var basket = {};

    const networkFilters = {
        urls: [
            "<all_urls>"
        ]
    };

    chrome.runtime.onMessage.addListener((msg, sender, response) => {
        switch (msg.type) {
            case 'popupInit':
                response(
                  Object.assign({},tabStorage[msg.tabId],{basket: basket})
                );
                break;
            case 'docLoad':
                console.log("DOC RCVD");
                analyzeHTMLBody(msg.doc);
                break;
            case 'basketUpd':
                basket = msg.basket;
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

    function fetchHttp(url) {
      fetchWorkStart(url,"follow");
      if(url.startsWith("http:")) {
        fetchWorkStart(url.replace(/^http\:/i,"https:"),"follow");
      }
    }

    function fetchWorkStart(url,follow) {
      if(url in cache) {
        console.log("no fetch, already cached")
        compileData(url,activeTab);
        return;
      }
      fetchWorkHeader(url,follow);
    }

    function fetchWorkHeader(url,follow) {
      console.log("HEAD "+url);
      var tregex = /application\/(ld\+)?json/i;
      fetch(url, {method: 'HEAD', cache: "force-cache", follow: follow})
        .then((response) => {
            var c = response.headers.get("access-control-allow-origin");
            if( c=="*") {
              cache_cors[url]=true;
            } else {
              cache_cors[url]=false;
            }
            var t = response.headers.get("content-type");
            console.log(response.status);
            if( (t&&t.match(tregex)) || response.status!=200) { // bad implementations crash if you send them HEAD
              console.log("Accepted for GET Req: "+url);
              fetchWorkBody(url,follow);
            }
        })
        .catch((error) => {
            cache[url] = false;
            console.debug('Error HEAD Req:', error);
            console.log("Let's try GET... "+" // "+url);
            fetchWorkBody(url,follow);
        });
    }

    function fetchWorkBody(url,follow) {
      fetch(url, {method: 'GET', cache: "force-cache", follow: follow})
          .then(res => res.json())
          .then((data) => {
              // console.log(data);
              // console.log(url);
              // console.log(activeTab);
              cache[url] = data;
              // var c = res.headers.get("access-control-allow-origin");
              // if( c=="*") {
              //   cache_cors[url]=true;
              // } else {
              //   cache_cors[url]=false;
              // }
              compileData(url,activeTab);
              // console.log("TAB: "+tabStorage[activeTab]);
          })
          .catch((error) => {
              cache[url] = false;
              console.debug('Error GET Req:', error);
          });
    }

    function compileData(url,tabId) {
        var data = cache[url]

        var iiif = analyzeJSONBody(data,url);
        if(!iiif) {
            console.log("NO for "+url);
            return;
        }
        console.log("OK for "+url);
        if (!tabStorage.hasOwnProperty(tabId)) {
            initTabStorage(tabId);
        }

        // manifesto experiment
        // manifesto.loadManifest(url).then(function(manifest){
          // var m = manifesto.parseManifest(JSON.stringify(data));
          // console.log("MANIFESTO: "+manifesto.LanguageMap.getValue(m.getLabel(), 'en-gb'));
        // });

        var item = {}
        item.id = data['@id'];
        item.url = url;
        item.cors = cache_cors[url];
        item.error = 0;
        if(iiif.api=="presentation" && iiif.type=="manifest") {
            try {
              if (typeof data.label === 'string' || data.label instanceof String) {
                item.label = data.label;
              } else {
                item.label = data.label[0]['@value'];
              }
              item.thumb = data['sequences'][0]['canvases'][0]['images'][0]['resource']['service']['@id']+'/full/100,/0/default.jpg';
            } catch(err) {
              item.error = 1;
              item.label = url;
              item.thumb = "logo-small-grey.png";
            }
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

    function analyzeHTMLBody(doc) {

      // start guessing by URL

      chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let url = tabs[0].url;
        console.log(tabs[0].id+" / "+tabs[0]+url);

        // Europeana – SMK
        var regex_epa = /https\:\/\/www\.europeana\.eu\/..\/item\/([^\/]+)\/([^\?\"]+).*/i;
        var params = url.match(regex_epa);
        if(params && params.length>2) {
          switch(params[1]) {
            case '2020903':
              var murl = "https://api.smk.dk/api/v1/iiif/manifest/?id="+params[2];
              break;
            default:
              var murl=false
              break;
          }
          if(murl) {
            console.log(murl);
            fetchHttp(murl);
          }
        }

        // Nationalmuseum SE
        var regex_nationalmuseumse1 = /https\:\/\/nationalmuseumse\.iiifhosting\.com\/iiif\/[^\/]+\//i;
        var params = url.match(regex_nationalmuseumse1);
        if(params) {
          fetchHttp(url+"manifest.json");
        }

        // Generic, for relative Links (Yes, some people do This)
        var regex_generic = /\"(\/[^\"]*(iiif|manifest)[^\"]*)\"/gi;
        var params = [...doc.matchAll(regex_generic)];
        if(params) {
          var base = url.split('/')
          var base = base[0]+'//'+base[2]
          params.forEach((hit, i) => {
            if(hit.length>1) {
              console.log("check guess: "+base+hit[1]);
              fetchHttp(base+hit[1]);
            }
          });
        }

      });

      // Document Content: NGA
      var regex_nga = /https\:\/\/www\.nga\.gov\/api\/v1\/iiif\/presentation\/manifest\.json\?cultObj\:id\=[0-9]+/i;
      var params = doc.match(regex_nga);
      if(params) {
        params.forEach((inurl, i) => {
          var url = inurl.replace("cultObj:id","cultObj%3Aid");
          url = url.replace("/content/ngaweb","");
          console.log(url);
          fetchHttp(url);
        });
      }

      // Generic 1, should match e.g. National Museum Sweden
      var regex_generic = /\"(https\:\/\/[^\"]*(iiif|manifest)[^\"]*)\"/gi;
      var params = [...doc.matchAll(regex_generic)];
      if(params) {
        params.forEach((hit, i) => {
          if(hit.length>1) {
            console.log("check guess type 1: "+hit[1]);
            fetchHttp(hit[1]);
          }
        });
      }

      // Generic 2, intra-Link
      var regex_generic = /\"https[\"]*=(https\:\/\/[^\"\&]*(iiif|manifest)[^\"\&]*)[\"\&]/gi;
      var params = [...doc.matchAll(regex_generic)];
      if(params) {
        params.forEach((hit, i) => {
          if(hit.length>1) {
            console.log("check guess type 2: "+hit[1]);
            fetchHttp(hit[1]);
          }
        });
      }


      // var offdoc = document.createElement('html');
      // offdoc.innerHTML = doc;
      // var links = offdoc.getElementsByTagName('a');
      // for(var i = 0; i< links.length; i++) {
      //   var link = links[i].href;
      //   if(link.includes("iiif")) {
      //     console.log(link);
      //   }
      // }

    }

    function analyzeJSONBody(body,url) {
        if(!body.hasOwnProperty("@context")) {
            cache[url]=false; // that's no IIIF, block by cache rule
            return(false);
        }

        var ctx = body["@context"].split("/");
        // alert(JSON.stringify(ctx));

        if(ctx[2]!=="iiif.io" || ctx[3]!=="api") {
            cache[url]=false; // again. no IIIF, block by cache rule
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
            "instagram.com", "twitch.tv", "twimg.com"
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

        // console.log("URL: "+url);

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
        var cors = 0;

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
                cache_cors[url] = cors = 1;
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
                compileData(url,tabId);
                return;
            }
        } else {
            console.debug("DETEKTIIIF CACHE MISS: "+url);
            fetchHttp(url);
        }

        // console.log(tabStorage[tabId].requests[details.requestId]);

    }, networkFilters, ["responseHeaders"]);

    chrome.tabs.onUpdated.addListener((tabId,changeInfo,tab) => {
        console.log("UPDATE TAB "+tabId)

        if(changeInfo.status === 'complete') {
          chrome.tabs.executeScript({
            code: "chrome.runtime.sendMessage({type: 'docLoad', doc: document.documentElement.innerHTML});" // or 'file: "getPagesSource.js"'
          }, function(result) {
            if (chrome.runtime.lastError) {
              // console.error(chrome.runtime.lastError.message);
            } else {
              console.log(result)
            }
          });
        }

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
