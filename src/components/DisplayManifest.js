import React, { Component } from 'react';
import manifesto from 'manifesto.js';

export default class DisplayManifest extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        var corsflag={};
        corsflag[true.toString()] = <span className="green_block">CORS</span>
        corsflag["1"] = <span className="green_block">CORS</span>
        corsflag[false.toString()] = <span className="red_block">CORS</span>
        corsflag["0"] = <span className="red_block">CORS</span>
        corsflag["2"] = <span className="grey_block">CORS</span>

        var httpsflag={};
        httpsflag[true.toString()] = <span className="green_block">HTTPS</span>
        httpsflag["1"] = <span className="green_block">HTTPS</span>
        httpsflag[false.toString()] = <span className="red_block">HTTPS</span>
        httpsflag["0"] = <span className="red_block">HTTPS</span>
        httpsflag["2"] = <span className="grey_block">HTTPS</span>

        var errorflag={};
        errorflag[0] = "";
        errorflag[1] = <div className="error_block">no images</div>;

        // alert("DM: "+this.props.label);
        // alert("DM "+JSON.stringify(this.props));

        // need more logic here: URL vs ID
        // <a href={this.props.id} target="_blank">{this.props.id}</a><br />

        return (
            <div className="box">
                <div className="box_icon" style={{backgroundImage:`url(${this.props.thumb})`}}>
                  {errorflag[this.props.error]}
                </div>
                <div className="box_text">
                    {this.props.label}<br />
                    <a href={this.props.url} target="_blank">{this.props.url}</a><br />
                    {corsflag[this.props.cors.toString()]}
                    {httpsflag[this.props.url.startsWith("https").toString()]}<br />
                </div>
            </div>
        );
    }
}
