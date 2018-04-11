"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Request = require("request-promise");
const WebSocket = require("ws");
const Logger_1 = require("./Logger");
const APIConfig_1 = require("./APIConfig");
const APIAuthenticator_1 = require("./APIAuthenticator");
class Purifier {
    constructor(deviceId) {
        this.deviceId = deviceId;
        let props = {
            power: false,
            fanSpeed: 0,
            mode: 0,
            mood: 0,
            dustPollutionLev: 0,
            filter1ExchAlarm: false,
            filter2ExchAlarm: false
        };
        this.properties = props;
        this.subscribeToWebsocket();
        this.getLatestData();
        this.getFilterLifeLevels().then((properties) => {
            this.filterProperties = properties;
        });
    }
    subscribeToWebsocket() {
        this.socket = new WebSocket(APIConfig_1.APIConfig.wsUri);
        this.socket.onopen = () => {
            this.socket.send(JSON.stringify({
                cmd: 'subscribe',
                param: [{ productId: this.deviceId }]
            }));
        };
        this.socket.onmessage = ((message) => {
            let data = JSON.parse(message.data);
            if (!data.hasOwnProperty('body') || Object.keys(data.body).length == 0) {
                Logger_1.Logger.log('No data found in response');
                return;
            }
            this.properties = data.body;
            Logger_1.Logger.log(`Got data: ${JSON.stringify(data)}`);
        });
        this.socket.onclose = () => {
            Logger_1.Logger.log('Connection lost. Reconnecting...');
            setTimeout(() => {
                this.subscribeToWebsocket();
            }, 5000);
        };
    }
    getLatestData() {
        let options = {
            uri: `${APIConfig_1.APIConfig.baseUri}/${APIConfig_1.APIConfig.triggerEndpoint}`,
            headers: {
                'User-Agent': APIConfig_1.APIConfig.userAgent
            },
            method: 'POST',
            json: true,
            body: {
                productId: this.deviceId,
                userToken: APIAuthenticator_1.Authenticator.token
            }
        };
        return new Promise((resolve, reject) => {
            Request(options).then((response) => {
                resolve(true);
            }).catch((err) => {
                Logger_1.Logger.log(`Encountered an error when trying to get data: ${err}`);
                reject(false);
            });
        });
    }
    togglePower(on) {
        let options = {
            uri: `${APIConfig_1.APIConfig.baseUri}/${APIConfig_1.APIConfig.toggleAttributeEndpoint}`,
            headers: {
                'User-Agent': APIConfig_1.APIConfig.userAgent
            },
            method: 'POST',
            json: true,
            body: {
                productId: this.deviceId,
                userToken: APIAuthenticator_1.Authenticator.token,
                command: 'POWER',
                value: on
            }
        };
        return new Promise((resolve, reject) => {
            Request(options).then((response) => {
                resolve();
            }).catch((err) => {
                Logger_1.Logger.log(`Encountered an error when trying to toggle power: ${err}`);
                reject(err);
            });
        });
    }
    setFanSpeed(fanSpeed) {
        let options = {
            uri: `${APIConfig_1.APIConfig.baseUri}/${APIConfig_1.APIConfig.toggleAttributeEndpoint}`,
            headers: {
                'User-Agent': APIConfig_1.APIConfig.userAgent
            },
            method: 'POST',
            json: true,
            body: {
                productId: this.deviceId,
                userToken: APIAuthenticator_1.Authenticator.token,
                command: 'FAN_SPEED',
                value: fanSpeed
            }
        };
        return new Promise((resolve, reject) => {
            Request(options).then((response) => {
                resolve();
            }).catch((err) => {
                Logger_1.Logger.log(`Encountered an error when trying to set fan speed: ${err}`);
                reject(err);
            });
        });
    }
    getFilterLifeLevels() {
        let options = {
            uri: `${APIConfig_1.APIConfig.baseUri}/${APIConfig_1.APIConfig.filterEndpoint}`,
            headers: {
                'User-Agent': APIConfig_1.APIConfig.userAgent
            },
            method: 'POST',
            json: true,
            body: {
                productId: this.deviceId,
                userToken: APIAuthenticator_1.Authenticator.token
            }
        };
        return new Promise((resolve, reject) => {
            Request(options).then((response) => {
                resolve(response.body);
            }).catch((err) => {
                Logger_1.Logger.log(`Encountered an error when getting filter status: ${err}`);
                reject(err);
            });
        });
    }
    toggleLight(on) {
        let options = {
            uri: `${APIConfig_1.APIConfig.baseUri}/${APIConfig_1.APIConfig.toggleAttributeEndpoint}`,
            headers: {
                'User-Agent': APIConfig_1.APIConfig.userAgent
            },
            method: 'POST',
            json: true,
            body: {
                productId: this.deviceId,
                userToken: APIAuthenticator_1.Authenticator.token,
                command: 'MOOD',
                value: (on ? 2 : 0)
            }
        };
        return new Promise((resolve, reject) => {
            Request(options).then((response) => {
                resolve();
            }).catch((err) => {
                Logger_1.Logger.log(`Encountered an error when trying to toggle light: ${err}`);
                reject();
            });
        });
    }
}
exports.Purifier = Purifier;
//# sourceMappingURL=Purifier.js.map