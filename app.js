"use strict";
//if (process.env.DEBUG === '1')
{
    require('inspector').open(9221, '0.0.0.0', false);
}

const Homey = require('homey');

class netScanApp extends Homey.App
{
    async onInit()
    {
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

            console.log('memwarn!');
        });
    }
}
module.exports = netScanApp;