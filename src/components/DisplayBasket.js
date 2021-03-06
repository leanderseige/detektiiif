import React, { Component } from 'react';
import manifesto from 'manifesto.js';

export default class DisplayBasket extends Component {
    constructor(props) {
        super(props);
        // this.copyUrl = this.copyUrl.bind(this);
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
                    <button onClick={() => this.props.copyUrl(this.props.url)}>COPY URL</button>
                    <button onClick={() => this.props.removeFromBasket(this.props.url)}>REM FROM BASKET</button>
                    <a href={'https://universalviewer.io/uv.html?manifest='+this.props.url} target="_blank">UV</a>&nbsp;
                    <a href={'https://demo.tify.rocks/demo.html?manifest='+this.props.url} target="_blank">TIFY</a>&nbsp;
                    <a href={'https://manducus.net/m3?manifest='+this.props.url} target="_blank">M3</a>
                </div>
            </div>
        );
    }
}
