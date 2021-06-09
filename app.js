"use strict";
if (process.env.DEBUG === '1')
{
    require('inspector').open(9221, '0.0.0.0', true);
}

const Homey = require('homey');

class netScanApp extends Homey.App
{
    async onInit()
    {
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

        let device_is_online_condition = this.homey.flow.getConditionCard('device_is_online');
        device_is_online_condition.registerRunListener(async (args, state) =>
        {
            return !args.device.offline; // true or false
        });

        let device_is_offline_condition = this.homey.flow.getConditionCard('device_is_offline');
        device_is_offline_condition.registerRunListener(async (args, state) =>
        {
            return args.device.offline; // true or false
        });

        this.homey.on('cpuwarn', () =>
        {
            const drivers = this.homey.drivers.getDrivers();
            for (const driver in drivers)
            {
                let devices = this.homey.drivers.getDriver(driver).getDevices();

                for (let i = 0; i < devices.length; i++)
                {
                    let device = devices[i];
                    if (device.slowDown)
                    {
                        device.slowDown();
                    }
                }
            }

            console.log('cpuwarn!');
        });
    }
}
module.exports = netScanApp;