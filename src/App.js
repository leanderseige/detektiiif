/*global chrome*/
import React, { Component } from 'react';
import './App.css';
import TrafficContainer from "./components/TrafficContainer";
import {getCurrentTab} from "./common/Utils";
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import DisplayManifest from "./components/DisplayManifest";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            traffic: {},
            manifests: {},
            collections: {},
            images: {}
        };
    }

    analyzeBody(body) {
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

        // alert(JSON.stringify(iiif))

        return(iiif);
    }


    componentDidMount() {
        getCurrentTab((tab) => {
            chrome.runtime.sendMessage({type: 'popupInit', tabId: tab.id}, (response) => {
                if (response) {
                    Object.keys(response.requests).map((key) => {
                        const {url, requestDuration, status, responseHeaders} = response.requests[key];
                        fetch(url)
                            .then(res => res.json())
                            .then((data) => {
                                var iiif = this.analyzeBody(data);
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
                                    let temp = Object.assign({}, this.state.manifests);
                                    temp[item.id] = item;
                                    this.setState({manifests: temp});
                                } else {
                                    let temp = Object.assign({}, this.state.images);
                                    temp[item.id] = item;
                                    this.setState({images: temp});
                                }
                                // alert("APP "+JSON.stringify(this.state.manifests));
                            })
                        .catch(console.log)
                    });
                    this.setState({
                        traffic: Object.assign(this.state.traffic, response)
                    });
                }
            });
        });
    }

    render() {
        let ms = [];
        for (var key in this.state.manifests) {
            ms.push(<
                DisplayManifest
                key = { `item-${this.state.manifests[key].id}` }
                id = { this.state.manifests[key].id }
                label = { this.state.manifests[key].label }
                thumb = { this.state.manifests[key].thumb }
                url = { this.state.manifests[key].url }
            />)
        }

        let is = [];
        for (var key in this.state.images) {
            is.push(<
                DisplayManifest
                key = { `item-${this.state.images[key].id}` }
                id = { this.state.images[key].id }
                label = { this.state.images[key].label }
                thumb = { this.state.images[key].thumb }
                url = { this.state.images[key].url }
            />)
        }


        // alert("APP "+JSON.stringify(this.state.manifests));

        return (
          <div className="App">
            <header className="App-header">
              <h1 className="App-title">detektIIIF</h1>
            </header>
            <h2>Presentation API: Manifests</h2>
            <ul>
                {ms}
            </ul>
            <h2>Image API</h2>
            <ul>
                {is}
            </ul>
          </div>
        );
    }
}

export default App;
