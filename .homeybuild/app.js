"use strict";
if (process.env.DEBUG === '1')
{
    require('inspector').open(9221, '0.0.0.0', true);
}

const Homey = require('homey');
const nodemailer = require("nodemailer");

class netScanApp extends Homey.App
{
    async onInit()
    {
        this.diagLog = "";
        this.logLevel = this.homey.settings.get('logLevel');
        if (this.logLevel === null)
        {
            this.logLevel = 0;
            this.homey.settings.set('logLevel', this.logLevel);
        }

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

            this.homey.app.updateLog('cpuwarn!');
        });

        // Callback for app settings changed
        this.homey.settings.on('set', async function(setting)
        {
            this.homey.app.updateLog("Setting " + setting + " has changed.");

            if (setting === 'logLevel')
            {
                this.homey.app.logLevel = this.homey.settings.get('logLevel');
            }
        });
    }

    varToString(source)
    {
        try
        {
            if (source === null)
            {
                return "null";
            }
            if (source === undefined)
            {
                return "undefined";
            }
            if (source instanceof Error)
            {
                let stack = source.stack.replace('/\\n/g', '\n');
                return source.message + '\n' + stack;
            }
            if (typeof(source) === "object")
            {
                const getCircularReplacer = () =>
                {
                    const seen = new WeakSet();
                    return (key, value) =>
                    {
                        if (typeof value === "object" && value !== null)
                        {
                            if (seen.has(value))
                            {
                                return;
                            }
                            seen.add(value);
                        }
                        return value;
                    };
                };

                return JSON.stringify(source, getCircularReplacer(), 2);
            }
            if (typeof(source) === "string")
            {
                return source;
            }
        }
        catch (err)
        {
            this.homey.app.updateLog("VarToString Error: " + this.homey.app.varToString(err), 0);
        }

        return source.toString();
    }

    updateLog(newMessage, errorLevel = 1)
    {
        const zeroPad = (num, places) => String(num).padStart(places, '0');

        if (errorLevel <= this.homey.app.logLevel)
        {
            console.log(newMessage);

            const nowTime = new Date(Date.now());

            this.diagLog += zeroPad(nowTime.getHours().toString(), 2);
            this.diagLog += ":";
            this.diagLog += zeroPad(nowTime.getMinutes().toString(), 2);
            this.diagLog += ":";
            this.diagLog += zeroPad(nowTime.getSeconds().toString(), 2);
            this.diagLog += ".";
            this.diagLog += zeroPad(nowTime.getMilliseconds().toString(), 3);
            this.diagLog += ": ";

            if (errorLevel === 0)
            {
                this.diagLog += "!!!!!! ";
            }
            else
            {
                this.diagLog += "* ";
            }
            this.diagLog += newMessage;
            this.diagLog += "\r\n";
            if (this.diagLog.length > 60000)
            {
                this.diagLog = this.diagLog.substr(this.diagLog.length - 60000);
            }
            this.homey.api.realtime('com.netscan.logupdated', { 'log': this.diagLog });
        }
    }

    async sendLog(logType)
    {
        let tries = 5;
        console.log("Send Log");
        while (tries-- > 0)
        {
            try
            {
                let subject = "";
                let text = "";
                if (logType === 'infoLog')
                {
                    subject = "Netscan Information log";
                    text = this.diagLog;
                }
                else
                {
                    subject = "Netscan device log";
                    text = this.detectedDevices;
                }

                subject += "(" + this.homeyHash + " : " + Homey.manifest.version + ")";

                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport(
                {
                    host: Homey.env.MAIL_HOST, //Homey.env.MAIL_HOST,
                    port: 465,
                    ignoreTLS: false,
                    secure: true, // true for 465, false for other ports
                    auth:
                    {
                        user: Homey.env.MAIL_USER, // generated ethereal user
                        pass: Homey.env.MAIL_SECRET // generated ethereal password
                    },
                    tls:
                    {
                        // do not fail on invalid certs
                        rejectUnauthorized: false
                    }
                });
                // send mail with defined transport object
                const response = await transporter.sendMail(
                {
                    from: '"Homey User" <' + Homey.env.MAIL_USER + '>', // sender address
                    to: Homey.env.MAIL_RECIPIENT, // list of receivers
                    subject: subject, // Subject line
                    text: text // plain text body
                });
                return {
                    error: response.err,
                    message: response.err ? null : "OK"
                };
            }
            catch (err)
            {
                this.logInformation("Send log error", err);
                return {
                    error: err,
                    message: null
                };
            }
        }
    }
}
module.exports = netScanApp;