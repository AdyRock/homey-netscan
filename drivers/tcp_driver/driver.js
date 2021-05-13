"use strict";

const Homey = require( 'homey' );
var net = require("net");

// the `init` method is called when your driver is loaded for the first time
class tcpDevice extends Homey.Driver
{
    async onInit()
    {
        console.info("Booting TCP driver");

        let device_is_online_condition = this.homey.flow.getConditionCard('device_is_online');
        device_is_online_condition.registerRunListener(async (args, state) =>
        {
            return args.device.state; // true or false
        });

        let device_is_offline_condition = this.homey.flow.getConditionCard('device_is_offline');
        device_is_offline_condition.registerRunListener(async (args, state) =>
        {
            return !args.device.state; // true or false
        });

        this.device_came_online_trigger = this.homey.flow.getDeviceTriggerCard('device_came_online');
        this.device_went_offline_trigger = this.homey.flow.getDeviceTriggerCard('device_went_offline');
    }

    ip_device_came_online(device, tokens, state)
    {
        this.ip_device_came_online_trigger.trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error);
    }

    ip_device_went_offline(device, tokens, state)
    {
        this.ip_device_went_offline_trigger.trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error);
    }

    // the `pair` method is called when a user start pairing
    async onPairListDevices()
    {
        console.log("Pairing started");

    }

}
module.exports = tcpDevice;

