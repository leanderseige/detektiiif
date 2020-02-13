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
            chrome.runtime.sendMessage({type: 'popupInit', tabId: tab.id}, (response) => {
                if (response) {
                    // alert(JSON.stringify(response.iiif))
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
            {ms}
            <h2>Image API</h2>
            {is}
          </div>
        );
    }
}

export default App;
