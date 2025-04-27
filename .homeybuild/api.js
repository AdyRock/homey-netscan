/*jslint node: true */
module.exports = {
    async getLog({ homey, query })
    {
        return homey.app.diagLog;
    },
    async clearLog({ homey, query })
    {
        homey.app.diagLog = "";
        return 'OK';
    },
    async SendInfoLog({ homey, query })
    {
        return homey.app.sendLog('infoLog');
    },
};