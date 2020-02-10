/*global chrome*/
import React, { Component } from 'react';
import './App.css';
import TrafficContainer from "./components/TrafficContainer";
import {getCurrentTab} from "./common/Utils";
import { createStore } from 'redux'
import { Provider } from 'react-redux'

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            traffic: {}
        };
    }

    componentDidMount() {
        getCurrentTab((tab) => {
            chrome.runtime.sendMessage({type: 'popupInit', tabId: tab.id}, (response) => {
                if (response) {
                    this.setState({
                        traffic: Object.assign(this.state.traffic, response)
                    });
                }
            });
        });
    }

    render() {
        return (
          <div className="App">
            <header className="App-header">
              <h1 className="App-title">IIIF Spy</h1>
            </header>
            <p className="App-intro">
                <TrafficContainer traffic={this.state.traffic}/>
            </p>
          </div>
        );
    }
}

export default App;
