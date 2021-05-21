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

        let ip_device_is_online_condition = this.homey.flow.getConditionCard('ip_device_is_online');
        ip_device_is_online_condition.registerRunListener(async (args, state) =>
        {
            return !args.device.offline; // true or false
        });

        let ip_device_is_offline_condition = this.homey.flow.getConditionCard('ip_device_is_offline');
        ip_device_is_offline_condition.registerRunListener(async (args, state) =>
        {
            return args.device.offline; // true or false
        });

        this.ip_device_came_online_trigger = this.homey.flow.getDeviceTriggerCard('ip_device_came_online');
        this.ip_device_went_offline_trigger = this.homey.flow.getDeviceTriggerCard('ip_device_went_offline');
    }

    device_came_online(device, tokens, state)
    {
        this.ip_device_came_online_trigger
        .trigger(device, tokens, state)
        .catch(this.error);
    }

    device_went_offline(device, tokens, state)
    {
        this.ip_device_went_offline_trigger
        .trigger(device, tokens, state)
        .catch(this.error);
}

    // the `pair` method is called when a user start pairing
    async onPairListDevices()
    {
        console.log("Pairing started");

    }


}
module.exports = ipDriver;



