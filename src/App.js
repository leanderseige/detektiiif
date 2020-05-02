/*global chrome*/
import React, { Component } from 'react';
import './App.css';
import {getCurrentTab} from "./common/Utils";
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import DisplayManifest from "./components/DisplayManifest";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            manifests: {},
            collections: {},
            images: {}
        };
    }

    componentDidMount() {
        getCurrentTab((tab) => {
            chrome.runtime.sendMessage({type: 'popupInit', tabId: tab.id, url: tab.url}, (response) => {
                if (response) {
                    // console.log(JSON.stringify(response.iiif))
                    this.setState({...response.iiif});
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
                cors = { this.state.manifests[key].cors }
            />)
        }

        let cs = [];
        for (var key in this.state.collections) {
            cs.push(<
                DisplayManifest
                key = { `item-${this.state.collections[key].id}` }
                id = { this.state.collections[key].id }
                label = { this.state.collections[key].label }
                thumb = { this.state.collections[key].thumb }
                url = { this.state.collections[key].url }
                cors = { this.state.collections[key].cors }
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
                cors = { this.state.images[key].cors }
            />)
        }

        // alert("APP "+JSON.stringify(this.state.manifests));

        return (
          <div className="App">
            <header className="App-header">
              <h2 className="App-title">detektIIIF</h2>
            </header>
            <h3>Presentation API: Manifests</h3>
            {ms}
            <h3>Presentation API: Collections</h3>
            {cs}
            <h3>Image API</h3>
            {is}
          </div>
        );
    }
}

export default App;
