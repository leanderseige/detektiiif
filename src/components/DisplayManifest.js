import React, { Component } from 'react';
import manifesto from 'manifesto.js';

export default class DisplayManifest extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        var corsflag={};
        corsflag[true.toString()] = <span className="green_block">CORS</span>
        corsflag[false.toString()] = <span className="red_block">CORS</span>

        var httpsflag={};
        httpsflag[true.toString()] = <span className="green_block">HTTPS</span>
        httpsflag[false.toString()] = <span className="red_block">HTTPS</span>

        // alert("DM: "+this.props.label);
        // alert("DM "+JSON.stringify(this.props));
        return (
            <div className="box">
                <div className="box_icon" style={{backgroundImage:`url(${this.props.thumb})`}}>
                </div>
                <div className="box_text">
                    {this.props.label}<br />
                    <a href={this.props.id} target="_blank">{this.props.id}</a><br />
                    {corsflag[this.props.cors.toString()]}
                    {httpsflag[this.props.url.startsWith("https").toString()]}
                </div>
            </div>
        );
    }
}
