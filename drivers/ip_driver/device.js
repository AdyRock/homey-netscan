/*jslint node: true */
'use strict';

const Homey = require('homey');
var net = require("net");
const TcpIpDevice = require('../tcp_ip_device');

class ipDevice extends TcpIpDevice
{
    async onInit()
    {
        console.info("Booting IP device ", this.getName());
        super.onInit();
    }

    async onAdded()
    {
        this.port = null;
        await this.setSettings({'tcp_port': this.port});
    }

}
module.exports = ipDevice;