import React, { Component } from 'react';
import DisplayManifest from "./DisplayManifest";

export default class TrafficContainer extends Component {
    constructor(props) {
        super(props);
        // this.renderNetworkTrafficData = this.renderNetworkTrafficData.bind(this)
    }

    static renderNetworkTrafficData(requests) {
        // this.state.label="Hello";
        // var thumb="Thumb";
        if (requests) {
            // return(requests);
            return Object.keys(requests).map((key) => {
                const {url, requestDuration, status, responseHeaders} = requests[key];
                fetch(url)
                    .then(res => res.json())
                    .then((data) => {
                        // alert(data.label);
                        // var thumb = data['sequences'][0]['canvases'][0]['images'][0]['resource']['service']['@id']+'/full/200,/0/default.jpg';
                    })
                .catch(console.log)
                // return (<li>{`url ${url} took ${requestDuration}ms with status ${status}`}</li>);
                // return (<li>{`url ${url} headers ${responseHeaders}`}</li>);
                return (<DisplayManifest url={url} headers={responseHeaders} label={url} />);
            });
        }
        return '';
    }

    render() {
        return (
            <ul>
           {TrafficContainer.renderNetworkTrafficData(this.props.traffic.requests)}
            </ul>
        );
    }
}
