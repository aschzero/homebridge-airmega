const request = require('request-promise');
const WebSocket = require('ws');
const constants = require('./constants');

class Purifier {
  constructor(options) {
    this.deviceId = options.deviceId;
    this.userToken = options.userToken;
    this.debug = options.debug || false;
    this.log = options.log;

    this.power = null;
    this.fanSpeed = null;
    this.mode = null;
    this.mood = null;
    this.airQuality = null;
    this.preFilterAlarm = null;
    this.mainFilterAlarm = null;

    this.subscribeToWebsocket();
  }

  subscribeToWebsocket() {
    this.ws = new WebSocket(constants.WS_URI);
    
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        cmd: 'subscribe',
        param: [{ productId: this.deviceId }]
      }));
    }

    this.ws.onmessage = ((message) => {
      let data = JSON.parse(message.data);
      if (!data.hasOwnProperty('body') || Object.keys(data.body).length == 0) {
        this.debugLog('No data found in response');
        return;
      }

      this.debugLog(`Got data: ${JSON.stringify(data)}`);      

      this.setLatestData(data.body);
    });

    this.ws.onclose = () => {
      this.debugLog('Reconnecting...');

      setTimeout(() => {
        this.subscribeToWebsocket();
      }, 5000);
    }
  }

  setLatestData(data) {
    this.power = data.power;
    this.fanSpeed = data.fanSpeed;
    this.mode = data.mode;
    this.mood = data.mood;
    this.airQuality = data.dustPollutionLev;
    this.preFilterAlarm = data.filter1ExchAlarm;
    this.mainFilterAlarm = data.filter2ExchAlarm;
  }

  getLatestData() {
    let options = {    
      uri: `${constants.API_URI}/${constants.ENDPOINTS['trigger']}`,
      headers: {
        'User-Agent': constants.USER_AGENT
      },
      method: 'POST',
      json: true,
      body: {
        productId: this.deviceId,
        userToken: this.userToken
      }
    }

    request(options).promise().bind(this).then((response) => {
      this.debugLog('Triggered a fetch to get latest data');
    }).catch((err) => {
      this.log(`Encountered an error when trying to get user token: ${err}`);
    });
  }

  setPower(on) {
    let options = {    
      uri: `${constants.API_URI}/${constants.ENDPOINTS['power']}`,
      headers: {
        'User-Agent': constants.USER_AGENT
      },
      method: 'POST',
      json: true,
      body: {
        productId: this.deviceId,
        userToken: this.userToken,
        command: 'POWER',
        value: on
      }
    }

    return new Promise((resolve, reject) => {
      request(options).promise().bind(this).then((response) => {
        resolve();
      }).catch((err) => {
        this.log(`Encountered an error when trying to toggle power: ${err}`);
        reject(err);
      });
    });
  }

  setFanSpeed(fanSpeed) {
    let options = {    
      uri: `${constants.API_URI}/${constants.ENDPOINTS['fan']}`,
      headers: {
        'User-Agent': constants.USER_AGENT
      },
      method: 'POST',
      json: true,
      body: {
        productId: this.deviceId,
        userToken: this.userToken,
        command: 'FAN_SPEED',
        value: fanSpeed
      }
    }

    return new Promise((resolve, reject) => {
      request(options).promise().bind(this).then((response) => {
        resolve();
      }).catch((err) => {
        this.log(`Encountered an error when trying to set fan speed: ${err}`);
        reject(err);
      });
    });
  }

  getFilterLifeLevels() {
    let options = {    
      uri: `${constants.API_URI}/${constants.ENDPOINTS['filter']}`,
      headers: {
        'User-Agent': constants.USER_AGENT
      },
      method: 'POST',
      json: true,
      body: {
        productId: this.deviceId,
        userToken: this.userToken
      }
    }

    return new Promise((resolve, reject) => {
      request(options).promise().bind(this).then((response) => {
        resolve(response.body);
      }).catch((err) => {
        this.log(`Encountered an error when getting filter status: ${err}`);
        reject(err);
      });
    });
  }

  debugLog(message) {
    if (!this.debug) return;

    this.log(message);
  }
}

module.exports = Purifier;
