import React, { Component } from 'react';
import manifesto from 'manifesto.js';

export default class DisplayManifest extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        // alert("DM: "+this.props.label);
        // alert("DM "+JSON.stringify(this.props));
        return (
            <li>
            <img src={this.props.thumb} width="64" />
            {this.props.label} – {this.props.id}
            </li>
        );
    }
}
