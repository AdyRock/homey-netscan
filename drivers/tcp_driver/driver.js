"use strict";

const Homey = require('homey');
var net = require("net");

// the `init` method is called when your driver is loaded for the first time
class tcpDriver extends Homey.Driver
{
    async onInit()
    {
        console.info("Booting TCP driver");

        this.device_came_online_trigger = this.homey.flow.getDeviceTriggerCard('device_came_online');
        this.device_went_offline_trigger = this.homey.flow.getDeviceTriggerCard('device_went_offline');
        this.device_changed_state_trigger = this.homey.flow.getDeviceTriggerCard('device_change');
    }

    device_came_online(device)
    {
        this.device_came_online_trigger
            .trigger(device)
            .catch(this.error);

        let tokens = {
            value: true
        };

        this.device_changed_state_trigger
            .trigger(device, tokens)
            .catch(this.error);
    }

    device_went_offline(device)
    {
        this.device_went_offline_trigger
            .trigger(device)
            .catch(this.error);

        let tokens = {
            value: true
        };

        this.device_changed_state_trigger
            .trigger(device, tokens)
            .catch(this.error);
    }

    // the `pair` method is called when a user start pairing
    async onPairListDevices()
    {
        console.log("Pairing started");

    }

}
module.exports = tcpDriver;