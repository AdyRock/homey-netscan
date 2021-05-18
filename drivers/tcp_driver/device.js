/*jslint node: true */
'use strict';

const Homey = require( 'homey' );
var net = require("net");

class tcpDevice extends Homey.Device
{
    async onInit()
    {
        console.info("Booting TCP device ", this.getName());
        if (this.hasCapability('ip_present'))
        {
            this.addCapability('alarm_offline');
            this.removeCapability('ip_present');
        }

        this.offline = this.getCapabilityValue('alarm_offline');
        this.host = this.getSetting( 'host' );
        this.port = this.getSetting( 'tcp_port' );

        this.checkInterval = this.getSetting('host_check_interval');
        if (!this.checkInterval || (this.checkInterval < 15))
        {
            this.checkInterval = 15;
        }
        this.checkInterval = 1000 * this.checkInterval;

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

    // the `added` method is called is when pairing is done and a device has been added
    async onAdded ()
    {
    }

    // the `delete` method is called when a device has been deleted by a user
    async onDeleted()
    {
    }

    async onSettings( { oldSettings, newSettings, changedKeys } )
    {
        if ( changedKeys.indexOf( "host" ) >= 0 )
        {
            this.host = newSettings.host;
        }

        if ( changedKeys.indexOf( "tcp_port" ) >= 0 )
        {
            this.port = newSettings.tcp_port;
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

        this.homey.clearTimeout(this.checkTimer);
        this.homey.clearTimeout(this.cancelCheck);
        this.client.destroy();
        this.scanDevice();
    }

    async scanDevice()
    {
        const _this = this;
        console.info("Checking TCP device ", _this.getName(), " - ", _this.host, ":", _this.port);

        _this.client = new net.Socket();

        _this.cancelCheck = _this.homey.setTimeout(function()
        {
            console.info("TCP device Timeout", _this.getName());
            handleOffline();
            _this.client.destroy();
        }, _this.hostTimeout);

        var handleOnline = function()
        {
            _this.homey.clearTimeout(_this.cancelCheck);
            _this.client.destroy();

            if ((_this.offline === null) || _this.offline)
            {
                console.info("TCP device came Online ", _this.getName(), " - ", _this.host);
                _this.offline = false;
                _this.setCapabilityValue('alarm_offline', false);

                // Trigger the online action
                _this.driver.device_came_online(_this);
            }

            _this.checkTimer = _this.homey.setTimeout(_this.scanDevice, _this.checkInterval);
        };

        var handleOffline = function()
        {
            _this.homey.clearTimeout(_this.cancelCheck);
            if ((_this.offline === null) || !_this.offline)
            {
                console.info("TCP device went Off line ", _this.getName(), " - ", _this.host);
                _this.offline = true;
                _this.setCapabilityValue('alarm_offline', true);

                // Trigger the offline action
                _this.driver.device_went_offline(_this);
            }

            _this.checkTimer = _this.homey.setTimeout(_this.scanDevice, _this.checkInterval);
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

        _this.client.connect(_this.port, _this.host, function()
        {
            handleOnline();
        });
    }

    async slowDown()
    {
        this.checkInterval *= 2;   
    }
    
}
module.exports = tcpDevice;