/*jslint node: true */
'use strict';

const Homey = require( 'homey' );
var net = require("net");
const TcpIpDevice = require('../tcp_ip_device');

class tcpDevice extends TcpIpDevice
{
    async onInit()
    {
        console.info("Booting TCP device ", this.getName());
        super.onInit();
    }
}
module.exports = tcpDevice;