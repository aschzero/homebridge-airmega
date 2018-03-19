const request = require('request-promise');
const WebSocket = require('ws');
const constants = require('./constants');

class Purifier {
  constructor(options) {
    this.deviceId = options.deviceId;
    this.userToken = options.userToken;
    this.log = options.log;
    this.ws = new WebSocket(constants.WS_URI);

    this.fetchedData = true;
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
    this.triggerLatestData();
    
    this.ws.onmessage = ((message) => {
      let data = JSON.parse(message.data);
      if (!data.hasOwnProperty('body')) {
        this.log('No body found in response');
        return;
      }

      this.fetchedData = true;
      this.power = data.body.power;
      this.fanSpeed = data.body.fanSpeed;
      this.mode = data.body.mode;
      this.airQuality = data.body.dustPollutionLev;

      this.log(`Got data: ${JSON.stringify(data.body)}`);
    });
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

module.exports = Purifier;
