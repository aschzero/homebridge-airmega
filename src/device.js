const request = require('request-promise');
const WebSocket = require('ws');
const constants = require('./constants');

class Device {
  constructor(options) {
    this.deviceId = options.deviceId;
    this.userToken = options.userToken;
    this.log = options.log;
    this.ws = new WebSocket(constants.WS_URI);

    this.latestData = {};
    this.hasLatestData = false;

    this.power = null;
    this.fanSpeed = null;
    this.mode = null;
    this.airQuality = null;

    this.subscribeToWebsocket();
    this.getLatestData();
  }

  subscribeToWebsocket() {
    let ws = this.ws;
    let subscribe = {
      cmd: 'subscribe',
      param: [{ productId: this.deviceId }]
    }

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify(subscribe));
    }
  }

  getLatestData() {
    return new Promise((resolve, reject) => {
      if (this.useCachedData()) {
        this.log('using cached data');
        resolve(this.latestData);
        return;
      } else {
        this.triggerLatestData();
      }

      this.log('no cached data, waiting for message')

      this.ws.onmessage = ((message) => {
        let data = JSON.parse(message.data);
        if (!data.hasOwnProperty('body')) {
          reject(new Error('No body found in response'));
        }

        this.latestData = data.body;
        this.hasLatestData = true;

        this.power = data.body.power;
        this.fanSpeed = data.body.fanSpeed;
        this.mode = data.body.mode;
        this.airQuality = data.body.dustPollutionLev;

        this.log(`Got data: ${JSON.stringify(this.latestData)}`);
        resolve(this.latestData);
      });
    });
  }

  useCachedData() {
    // be smarter here
    return (Object.keys(this.latestData).length > 0 && this.hasLatestData);
  }

  // As far as I can tell, this is just a dummy endpoint
  // used for nothing more than to trigger a websocket message
  triggerLatestData() {
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
      this.log('Triggered a fetch to get latest data');
    }).catch((err) => {
      this.log(`Encountered an error when trying to get user token: ${err}`);
    });
  }

  togglePower(on) {
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
}

module.exports = Device;
