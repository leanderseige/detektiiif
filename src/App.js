/*global chrome*/
import React, { Component } from 'react';
import './App.css';
import {getCurrentTab} from "./common/Utils";
// import { createStore } from 'redux'
// import { Provider } from 'react-redux'
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

        var cnn = Object.keys(this.state.collections).length;
        var mnn = Object.keys(this.state.manifests).length;
        var inn = Object.keys(this.state.images).length;

        let stat =
        <div className="App-status">
          <a href="#ancc">collections: {cnn}</a> |
          <a href="#ancm">manifests: {mnn}</a> |
          <a href="#anci">images: {inn}</a>
        </div>

        let ms = [];
        if(Object.keys(this.state.manifests).length>0) {
          ms.push(<h3>Presentation API: Manifests<a name="ancm" /></h3>)
          for (var key in this.state.manifests) {
              ms.push(<
                  DisplayManifest
                  key = { `item-${this.state.manifests[key].id}` }
                  id = { this.state.manifests[key].id }
                  label = { this.state.manifests[key].label }
                  thumb = { this.state.manifests[key].thumb }
                  url = { this.state.manifests[key].url }
                  cors = { this.state.manifests[key].cors }
                  error = { this.state.manifests[key].error }
              />)
          }
        }

        let cs = [];
        if(Object.keys(this.state.collections).length>0) {
          cs.push(<h3>Presentation API: Collections<a name="ancc" /></h3>)
          for (var key in this.state.collections) {
              cs.push(<
                  DisplayManifest
                  key = { `item-${this.state.collections[key].id}` }
                  id = { this.state.collections[key].id }
                  label = { this.state.collections[key].label }
                  thumb = { this.state.collections[key].thumb }
                  url = { this.state.collections[key].url }
                  cors = { this.state.collections[key].cors }
                  error = { this.state.collections[key].error }
              />)
          }
        }

        let is = [];
        if(Object.keys(this.state.images).length>0) {
          is.push(<h3>Image API<a name="anci" /></h3>)
          for (var key in this.state.images) {
              is.push(<
                  DisplayManifest
                  key = { `item-${this.state.images[key].id}` }
                  id = { this.state.images[key].id }
                  label = { this.state.images[key].label }
                  thumb = { this.state.images[key].thumb }
                  url = { this.state.images[key].url }
                  cors = { this.state.images[key].cors }
                  error = { this.state.images[key].error }
              />)
          }
        }

        // alert("APP "+JSON.stringify(this.state.manifests));

        let cc = ms.concat(cs,is)
        if(cc.length==0) {
          cc.push("No IIIF content on this page.")
        }

        return (
          <div className="App">
            <header className="App-header">
              <h2 className="App-title">detektIIIF</h2>
            </header>
            {stat}
            <div className="App-body">
            {cc}
            </div>
          </div>
        );
    }
}

export default App;
