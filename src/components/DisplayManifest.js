import React, { Component } from 'react';
import manifesto from 'manifesto.js';

export default class DisplayManifest extends Component {
    constructor(props) {
        super(props);
        // this.state.url = this.props.url;
    }

    render() {
        return (
            <li>
            <img src="logo-small.png" width="32" />
            {this.props.label}
            </li>
        );
    }
}
