/*jslint node: true */
'use strict';

const Homey = require('homey');
var net = require("net");

const ASSUMED_CLOSED_PORT = 1;

class ipDevice extends Homey.Device
{
    async onInit()
    {
        console.info("Booting TCP device ", this.getName());

        this.state = this.getCapabilityValue('ip_present');
        this.host = this.getSetting('host');

        this.checkInterval = this.getSetting('host_check_interval');
        if (!this.checkInterval || (this.checkInterval < 15))
        {
            this.checkInterval = 15;
        }
        this.checkInterval = 1000 * parseInt(this.checkInterval);

        this.hostTimeout = this.getSetting('host_timeout'); 
        if (!this.hostTimeout || (this.hostTimeout < 10))
        {
            this.hostTimeout = 10;
        }
        this.hostTimeout = 1000 * parseInt(this.hostTimeout);

        this.cancelCheck = null;
        this.scanDevice = this.scanDevice.bind(this);
        this.scanDevice();
    }

    async onAdded() {}

    async onDeleted() {}

    async onSettings( { oldSettings, newSettings, changedKeys } )
    {
        if ( changedKeys.indexOf( "host" ) >= 0 )
        {
            this.host = newSettings.host;
        }

        if ( changedKeys.indexOf( "host_check_interval" ) >= 0 )
        {
            this.checkInterval = newSettings.host_check_interval;
            if (!this.checkInterval || (this.checkInterval < 15))
            {
                this.checkInterval = 15;
            }
            this.checkInterval = 1000 * parseInt(this.checkInterval);
        }

        if ( changedKeys.indexOf( "host_timeout" ) >= 0 )
        {
            this.hostTimeout = newSettings.host_timeout;
            if (!this.hostTimeout || (this.hostTimeout < 10))
            {
                this.hostTimeout = 10;
            }
            this.hostTimeout = 1000 * parseInt(this.hostTimeout);
        }

        clearTimeout(this.cancelCheck);
        this.client.destroy();
        this.scanDevice();
    }

    async scanDevice()
    {
        const _this = this;
        console.info("Checking IP device", _this.getName());

        _this.client = new net.Socket();

        _this.cancelCheck = setTimeout(function()
        {
            console.info("IP device Timeout ", _this.getName());
            handleOffline();
            _this.client.destroy();
        }, _this.hostTimeout);

        var handleOnline = function()
        {
            clearTimeout(_this.cancelCheck);
            _this.client.destroy();

            if (!_this.state)
            {
                console.info("IP device Online ", _this.getName());
                _this.state = true;
                _this.setCapabilityValue('ip_present', true);

                // Trigger the online action
                _this.driver.device_came_online(_this);
            }

            setTimeout(_this.scanDevice, _this.checkInterval);
        };

        var handleOffline = function()
        {
            clearTimeout(_this.cancelCheck);
            if ((_this.state === null) || _this.state)
            {
                console.info("IP device Off line ", _this.getName());
                _this.state = false;
                _this.setCapabilityValue('ip_present', false);

                // Trigger the offline action
                _this.driver.device_went_offline(_this);
            }

            setTimeout(_this.scanDevice, _this.checkInterval);
        };

        _this.client.on('error', function(err)
        {
            if (err && err.errno && err.errno == "ECONNREFUSED")
            {
                handleOnline();
            }
            else if (err && err.errno && err.errno == "EHOSTUNREACH")
            {
                handleOffline();
            }
            else if (err && err.errno)
            {
                console.error("IP driver can only handle ECONNREFUSED and EHOSTUNREACH, but got " + err.errno);
            }
            else
            {
                console.error("IP driver can't handle " + err);
            }
            _this.client.destroy();
        });

        _this.client.connect(ASSUMED_CLOSED_PORT, _this.host, function()
        {
            handleOnline();
        });
    }

    async slowDown()
    {
        this.checkInterval *= 2;   
    }
}
module.exports = ipDevice;