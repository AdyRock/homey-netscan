"use strict";

// The IP driver works by connecting to a port and checking which error response one gets.
// We have to assume a port is closed, this assumption is corrected if a device appears to have the port open anyway.

// https://www.tutorialspoint.com/nodejs/nodejs_net_module.htm
var net = require("net");
const Homey = require('homey');

class ipDriver extends Homey.Driver
{
    // the `init` method is called when your driver is loaded for the first time
    async onInit()
    {
        console.info("Booting IP driver");

        this.ip_device_came_online_trigger = this.homey.flow.getDeviceTriggerCard('ip_device_came_online');
        this.ip_device_went_offline_trigger = this.homey.flow.getDeviceTriggerCard('ip_device_went_offline');
        this.ip_device_changed_state_trigger = this.homey.flow.getDeviceTriggerCard('ip_device_change');
    }

    device_came_online(device)
    {
        this.ip_device_came_online_trigger
            .trigger(device)
            .catch(this.error);

        let tokens = {
            value: true
        };

        this.ip_device_changed_state_trigger
            .trigger(device, tokens)
            .catch(this.error);
    }

    device_went_offline(device)
    {
        this.ip_device_went_offline_trigger
            .trigger(device)
            .catch(this.error);

        let tokens = {
            value: false
        };

        this.ip_device_changed_state_trigger
            .trigger(device, tokens)
            .catch(this.error);
    }

    // the `pair` method is called when a user start pairing
    async onPairListDevices()
    {
        console.log("Pairing started");

    }

}
module.exports = ipDriver;