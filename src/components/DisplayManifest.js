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
            <div className="box">
                <div className="box_icon" style={{backgroundImage:`url(${this.props.thumb})`}} />
                <div className="box_text">
                    {this.props.label}<br />
                    {this.props.id}<br />
                </div>
                <div className="box_info">
                CORS
                </div>
                <div className="box_copy">
                COPY
                </div>
            </div>
        );
    }
}
