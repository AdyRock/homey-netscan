"use strict";
if (process.env.DEBUG === '1')
{
    require('inspector').open(9222, '0.0.0.0', true);
}

const Homey = require('homey');

class netScanApp extends Homey.App
{
    async onInit()
    {

    }
}
module.exports = netScanApp;

