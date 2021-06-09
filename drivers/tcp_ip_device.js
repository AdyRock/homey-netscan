/*jslint node: true */
'use strict';

const Homey = require('homey');
var net = require("net");

class TcpIpDevice extends Homey.Device
{
    async onInit()
    {
        if (this.hasCapability('ip_present'))
        {
            this.addCapability('alarm_offline');
            this.removeCapability('ip_present');
        }

        this.offline = this.getCapabilityValue('alarm_offline');
        this.host = this.getSetting('host');
        this.port = this.getSetting('tcp_port');
        this.checkTimer = null;

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

        this.creatClient();
    }

    creatClient()
    {
        this.client = new net.Socket();
        this.client.setTimeout(this.hostTimeout);
        this.scanDevice2 = this.scanDevice2.bind(this);

        this.client.on('connect', () =>
        {
            this.handleOnline();
        });

        this.client.on('data', (data) =>
        {
            // Consume any data to prevent memory leaks
            console.log(data);
        });

        this.client.on('close', (hadError) =>
        {
            this.client.destroy();
            if (this.host)
            {
                // Not deleting device so start polling timer
                if (this.checkTimer)
                {
                    // If the timer is running then cancel it and start the scan immediately 
                    this.homey.clearTimeout(this.checkTimer);
                }
                this.checkTimer = this.homey.setTimeout(this.scanDevice2, this.checkInterval);
            }
        });

        this.client.on('error', (err) =>
        {
            if (err && err.errno && err.errno == "ECONNREFUSED")
            {
                if (this.port === null)
                {
                    this.handleOnline();
                    this.client.destroy();
                }
                else
                {
                    this.handleOffline();
                }
            }
            else if (err && err.errno && err.errno == "EHOSTUNREACH")
            {
                this.handleOffline();
            }
            else if (err && err.errno && err.errno == "EALREADY")
            {
                this.handleOnline();
            }
            else if (err && err.errno)
            {
                console.error("Device can only handle ECONNREFUSED and EHOSTUNREACH, but got " + err.errno);
            }
            else
            {
                console.error("Device can't handle " + err);
            }
        });

        this.scanDevice2();
    }

    // the `added` method is called is when pairing is done and a device has been added
    async onAdded() {}

    // the `delete` method is called when a device has been deleted by a user
    async onDeleted()
    {
        this.host = null;
        if (this.checkTimer)
        {
            this.homey.clearTimeout(this.checkTimer);
            this.checkTimer = null;
        }     

        if (this.cancelCheck)
        {
            this.homey.clearTimeout(this.cancelCheck);
            this.cancelCheck = null;
        }

        this.client.destroy();
    }

    async onSettings({ oldSettings, newSettings, changedKeys })
    {
        if (changedKeys.indexOf("host") >= 0)
        {
            this.host = newSettings.host;
        }

        if (changedKeys.indexOf("tcp_port") >= 0)
        {
            this.port = newSettings.tcp_port;
        }

        if (changedKeys.indexOf("host_check_interval") >= 0)
        {
            this.checkInterval = newSettings.host_check_interval;
            if (!this.checkInterval || (this.checkInterval < 15))
            {
                this.checkInterval = 15;
            }
            this.checkInterval = 1000 * parseInt(this.checkInterval);
        }

        if (changedKeys.indexOf("host_timeout") >= 0)
        {
            this.hostTimeout = newSettings.host_timeout;
            if (!this.hostTimeout || (this.hostTimeout < 10))
            {
                this.hostTimeout = 10;
            }
            this.hostTimeout = 1000 * parseInt(this.hostTimeout);
        }

        if (this.cancelCheck)
        {
            // If the timeout timer is running then a check is in progress so cancel it now
            this.homey.clearTimeout(this.cancelCheck);
        }

        if (this.checkTimer)
        {
            // If the timer is running then cancel it and start the scan immediately 
            this.homey.clearTimeout(this.checkTimer);
            this.checkTimer = null;

            this.client.setTimeout(this.hostTimeout);
            this.scanDevice2();
        }
    }

    handleOnline()
    {
        this.homey.clearTimeout(this.cancelCheck);
        this.cancelCheck = null;

        if ((this.offline === null) || this.offline)
        {
            console.info("Device came Online ", this.getName(), " - ", this.host);
            this.offline = false;
            this.setCapabilityValue('alarm_offline', false);

            // Trigger the online action
            this.driver.device_came_online(this);
        }
    }

    handleOffline()
    {
        this.homey.clearTimeout(this.cancelCheck);
        this.cancelCheck = null;
        if ((this.offline === null) || !this.offline)
        {
            console.info("Device went Off line ", this.getName(), " - ", this.host);
            this.offline = true;
            this.setCapabilityValue('alarm_offline', true);

            // Trigger the offline action
            this.driver.device_went_offline(this);
        }

        this.client.destroy();
    }

    async scanDevice2()
    {
        if (this.port === null)
        {
            console.info("Checking IP device ", this.getName(), " - ", this.host);
        }
        else
        {
            console.info("Checking TCP device ", this.getName(), " - ", this.host, "port", this.port);
        }

        this.cancelCheck = this.homey.setTimeout(() =>
        {
            this.cancelCheck = null;
            console.info("Device Timeout", this.getName());
            this.handleOffline();
        }, this.hostTimeout);

        this.client.connect(this.port ? this.port : 1, this.host, null);
    }

    async slowDown()
    {
        this.checkInterval *= 2;
        console.error("Device slow down " + this.checkInterval);
    }

}
module.exports = TcpIpDevice;