import * as Request from 'request-promise';
import * as RRequest from 'request';

import * as WebSocket from 'ws';

import { Logger } from "./Logger";
import { APIConfig } from "./APIConfig";
import { PurifierMetadataProperties, PurifierProperties, FilterProperties } from "./interfaces/Purifier";
import { Authenticator } from './APIAuthenticator';

export class Purifier {
  deviceId: string;
  socket: WebSocket;
  properties: PurifierProperties;
  filterProperties: FilterProperties;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    let props: PurifierProperties = {
      power: false,
      fanSpeed: 0,
      mode: 0,
      mood: 0,
      dustPollutionLev: 0,
      filter1ExchAlarm: false,
      filter2ExchAlarm: false
    }
    this.properties = props

    this.subscribeToWebsocket();
    this.getLatestData();
    this.getFilterLifeLevels().then((properties) => {
      this.filterProperties = properties;
    });
  }

  subscribeToWebsocket(): void {
    this.socket = new WebSocket(APIConfig.wsUri);

    this.socket.onopen = () => {
      this.socket.send(JSON.stringify({
        cmd: 'subscribe',
        param: [{ productId: this.deviceId }]
      }));
    }

    this.socket.onmessage = ((message) => {
      let data = JSON.parse(message.data);

      if (!data.hasOwnProperty('body') || Object.keys(data.body).length == 0) {
        Logger.log('No data found in response');
        return;
      }

      this.properties = (data.body as PurifierProperties);   

      Logger.log(`Got data: ${JSON.stringify(data)}`);
    });

    this.socket.onclose = () => {
      Logger.log('Connection lost. Reconnecting...');

      setTimeout(() => {
        this.subscribeToWebsocket();
      }, 5000);
    }
  }

  getLatestData(): Promise<boolean> {
    let options = {
      uri: `${APIConfig.baseUri}/${APIConfig.triggerEndpoint}`,
      headers: {
        'User-Agent': APIConfig.userAgent
      },
      method: 'POST',
      json: true,
      body: {
        productId: this.deviceId,
        userToken: Authenticator.token
      }
    }
    
    return new Promise((resolve, reject) => {
      Request(options).then((response) => {
        resolve(true);
      }).catch((err) => {
        Logger.log(`Encountered an error when trying to get data: ${err}`);
        reject(false);
      });
    });
  }

  togglePower(on: boolean): Promise<void> {
    let options = {
      uri: `${APIConfig.baseUri}/${APIConfig.toggleAttributeEndpoint}`,
      headers: {
        'User-Agent': APIConfig.userAgent
      },
      method: 'POST',
      json: true,
      body: {
        productId: this.deviceId,
        userToken: Authenticator.token,
        command: 'POWER',
        value: on
      }
    }

    return new Promise((resolve, reject) => {
      Request(options).then((response) => {
        resolve();
      }).catch((err) => {
        Logger.log(`Encountered an error when trying to toggle power: ${err}`);
        reject(err);
      });
    });
  }

  setFanSpeed(fanSpeed: number): Promise<void> {
    let options = {
      uri: `${APIConfig.baseUri}/${APIConfig.toggleAttributeEndpoint}`,
      headers: {
        'User-Agent': APIConfig.userAgent
      },
      method: 'POST',
      json: true,
      body: {
        productId: this.deviceId,
        userToken: Authenticator.token,
        command: 'FAN_SPEED',
        value: fanSpeed
      }
    }

    return new Promise((resolve, reject) => {
      Request(options).then((response) => {
        resolve();
      }).catch((err) => {
        Logger.log(`Encountered an error when trying to set fan speed: ${err}`);
        reject(err);
      });
    });
  }

  getFilterLifeLevels(): Promise<FilterProperties> {
    let options = {
      uri: `${APIConfig.baseUri}/${APIConfig.filterEndpoint}`,
      headers: {
        'User-Agent': APIConfig.userAgent
      },
      method: 'POST',
      json: true,
      body: {
        productId: this.deviceId,
        userToken: Authenticator.token
      }
    }

    return new Promise((resolve, reject) => {
      Request(options).then((response) => {
        resolve(response.body);
      }).catch((err) => {
        Logger.log(`Encountered an error when getting filter status: ${err}`);
        reject(err);
      });
    });
  }

  toggleLight(on: boolean): Promise<void> {
    let options = {
      uri: `${APIConfig.baseUri}/${APIConfig.toggleAttributeEndpoint}`,
      headers: {
        'User-Agent': APIConfig.userAgent
      },
      method: 'POST',
      json: true,
      body: {
        productId: this.deviceId,
        userToken: Authenticator.token,
        command: 'MOOD',
        value: (on ? 2 : 0)
      }
    }

    return new Promise((resolve, reject) => {
      Request(options).then((response) => {
        resolve();
      }).catch((err) => {
        Logger.log(`Encountered an error when trying to toggle light: ${err}`);
        reject();
      });
    });
  }
}