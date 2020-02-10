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

    componentDidMount() {
        getCurrentTab((tab) => {
            chrome.runtime.sendMessage({type: 'popupInit', tabId: tab.id}, (response) => {
                if (response) {
                    Object.keys(response.requests).map((key) => {
                        const {url, requestDuration, status, responseHeaders} = response.requests[key];
                        fetch(url)
                            .then(res => res.json())
                            .then((data) => {
                                var item = {}
                                item.id = data['@id'];
                                item.url = url;
                                item.label = url; // data.label;
                                item.thumb = "logo-small.png"; // data['sequences'][0]['canvases'][0]['images'][0]['resource']['service']['@id']+'/full/200,/0/default.jpg';
                                let temp = Object.assign({}, this.state.manifests);
                                temp[item.id] = item;
                                this.setState({manifests: temp});
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


        // alert("APP "+JSON.stringify(this.state.manifests));

        return (
          <div className="App">
            <header className="App-header">
              <h1 className="App-title">detektIIIF</h1>
            </header>
            {ms}
          </div>
        );
    }
}

export default App;
