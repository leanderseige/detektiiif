/*global chrome*/
import React, { Component } from 'react';
import './App.css';
import {getCurrentTab} from "./common/Utils";
// import { createStore } from 'redux'
// import { Provider } from 'react-redux'
import DisplayCollection from "./components/DisplayCollection";
import DisplayManifest from "./components/DisplayManifest";
import DisplayImage from "./components/DisplayImage";
import DisplayBasket from "./components/DisplayBasket";

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            manifests: {},
            collections: {},
            images: {},
            basket: {}
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

    copyUrl(url) {
      navigator.clipboard.writeText(url).then(function() {
        alert("URL copied.");
      }, function() {
        alert("Copying URL failed.");
      });
    }

    addToBasket(key) {
      // alert("aTB"+JSON.stringify(this.state.manifests[key]));
      const newbasket = Object.assign(this.state.basket);
      newbasket[key] = this.state.manifests[key];
      this.setState({
        basket: newbasket
      })
      // alert("aTB"+JSON.stringify(this.state.basket));
    }

    removeFromBasket(key) {
      const newbasket = Object.assign(this.state.basket);
      delete newbasket[key];
      this.setState({
        basket: newbasket
      })
    }

    render() {

        var cnn = Object.keys(this.state.collections).length;
        var mnn = Object.keys(this.state.manifests).length;
        var inn = Object.keys(this.state.images).length;
        var bnn = Object.keys(this.state.basket).length;

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
                  copyUrl = {this.copyUrl.bind(this)}
                  addToBasket = {this.addToBasket.bind(this)}
              />)
          }
        }

        let cs = [];
        if(Object.keys(this.state.collections).length>0) {
          cs.push(<h3>Presentation API: Collections<a name="ancc" /></h3>)
          for (var key in this.state.collections) {
              cs.push(<
                  DisplayCollection
                  key = { `item-${this.state.collections[key].id}` }
                  id = { this.state.collections[key].id }
                  label = { this.state.collections[key].label }
                  thumb = { this.state.collections[key].thumb }
                  url = { this.state.collections[key].url }
                  cors = { this.state.collections[key].cors }
                  error = { this.state.collections[key].error }
                  copyUrl = {this.copyUrl.bind(this)}
              />)
          }
        }

        let is = [];
        if(Object.keys(this.state.images).length>0) {
          is.push(<h3>Image API<a name="anci" /></h3>)
          for (var key in this.state.images) {
              is.push(<
                  DisplayImage
                  key = { `item-${this.state.images[key].id}` }
                  id = { this.state.images[key].id }
                  label = { this.state.images[key].label }
                  thumb = { this.state.images[key].thumb }
                  url = { this.state.images[key].url }
                  cors = { this.state.images[key].cors }
                  error = { this.state.images[key].error }
                  copyUrl = {this.copyUrl.bind(this)}
              />)
          }
        }

        let bs = [];
        if(Object.keys(this.state.basket).length>0) {
          bs.push(<h3>Basket<a name="ancb" /></h3>)
          for (var key in this.state.basket) {
              bs.push(<
                  DisplayBasket
                  key = { `item-${this.state.basket[key].id}` }
                  id = { this.state.basket[key].id }
                  label = { this.state.basket[key].label }
                  thumb = { this.state.basket[key].thumb }
                  url = { this.state.basket[key].url }
                  cors = { this.state.basket[key].cors }
                  error = { this.state.basket[key].error }
                  copyUrl = {this.copyUrl.bind(this)}
                  removeFromBasket = {this.removeFromBasket.bind(this)}
              />)
          }
        }

        // alert("APP "+JSON.stringify(this.state.manifests));

        let cc = ms.concat(cs,is,bs)
        if(cc.length==0) {
          cc.push("No IIIF content on this page.")
        }

        // <div className="App">
        //   <header className="App-header">
        //     <h2 className="App-title">detektIIIF</h2>
        //   </header>
        //
        //   </div>
        //
        return (
          <div className="App">
            <header className="App-header">
              <h2 className="App-title">detektIIIF</h2>
            </header>
                <Tabs>
                  <TabList>
                    <Tab>Manifests ({mnn})</Tab>
                    <Tab>Images ({inn})</Tab>
                    <Tab>Collections ({cnn})</Tab>
                    <Tab>Basket ({bnn})</Tab>
                  </TabList>
                  <TabPanel>
                    {ms}
                  </TabPanel>
                  <TabPanel>
                    {is}
                  </TabPanel>
                  <TabPanel>
                    {cs}
                  </TabPanel>
                  <TabPanel>
                    {bs}
                  </TabPanel>
                </Tabs>

              </div>
        );
    }
}

export default App;
