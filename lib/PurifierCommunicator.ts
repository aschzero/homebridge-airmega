import * as request from 'request-promise';
import * as store from 'store';

import { Config } from './Config';
import { Logger } from './HALogger';
import { Purifier, Request } from './types';

export class PurifierCommunicator {
  deviceId: string;

  constructor(deviceId?: string) {
    this.deviceId = deviceId;
  }

  async getPurifiers(): Promise<Purifier.Metadata[]> {
    let payload: Request.Payload = this.buildPayload(Config.Endpoints.DEVICE_LIST);

    try {
      let response = await this.sendRequest(payload);
      let purifiers: Purifier.Metadata[] = response.body.deviceInfos.map(device => {
        return {
          nickname: device.dvcNick,
          barcode: device.barcode
        } as Purifier.Metadata;
      });

      return purifiers;
    } catch(e) {
      Logger.log(`Unable to retrieve purifiers: ${e}`);
    }
  }

  async getStatus(): Promise<Purifier.Status> {
    let payload: Request.Payload = this.buildStatusPayload(Config.Endpoints.STATUS);
    let response = await this.sendRequest(payload);

    Purifier.State['0']

    let statusResponse = response.body.prodStatus[0];

    let status: Purifier.Status = {
      power: statusResponse['power'],
      light: statusResponse['light'],
      fan: statusResponse['airVolume'],
      state: statusResponse['prodMode']
    }

    Logger.debug('Status object', status);

    return status;
  }

  async setPower(on: boolean): Promise<void> {
    let value = on ? '1' : '0';
    let payload = this.buildControlPayload(Config.Codes.POWER, value);

    try {
      await this.sendRequest(payload);
    } catch(e) {
      Logger.log(`Unable to set power: ${e}`);
    }
  }

  async setMode(auto: boolean): Promise<void> {
    let value = auto ? '1' : '2';
    let payload = this.buildControlPayload(Config.Codes.MODE, value);

    try {
      await this.sendRequest(payload);
    } catch(e) {
      Logger.log(`Unable to set mode: ${e}`);
    }
  }

  async setFanSpeed(speed: number): Promise<void> {
    let value = speed.toString();
    let payload = this.buildControlPayload(Config.Codes.FAN, value);

    try {
      await this.sendRequest(payload);
    } catch(e) {
      Logger.log(`Unable to set fan speed: ${e}`);
    }
  }

  private async sendRequest(payload: Request.Payload) {
    Logger.debug('Sending payload', payload);

    let response = await request(payload);
    Logger.debug('Response', response);

    return response;
  }

  private buildPayload(endpoint: string): Request.Payload {
    let tokens = store.get('tokens');

    let header: Request.MessageHeader = {
      trcode: endpoint,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }

    let message: Request.Message = {
      header: header,
      body: {
        barcode: this.deviceId
      }
    }

    let payload: Request.Payload = {
      uri: `${Config.BASE_URI}/${endpoint}.json`,
      headers: {
        'Content-Type': Config.ContentType.FORM,
        'User-Agent': Config.USER_AGENT
      },
      method: 'POST',
      json: true,
      form: `message=${encodeURIComponent(JSON.stringify(message))}`
    }

    return payload;
  }

  private buildStatusPayload(endpoint: string): Request.Payload {
    let tokens = store.get('tokens');

    let header: Request.MessageHeader = {
      trcode: endpoint,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }

    let message: Request.Message = {
      header: header,
      body: {
        barcode: this.deviceId,
        dvcBrandCd: 'MG',
        prodname: 'AIRMEGA',
        stationCd: '',
        resetDttm: '',
        deviceType: '004'
      }
    }

    let payload: Request.Payload = {
      uri: `${Config.BASE_URI}/${endpoint}.json`,
      headers: {
        'Content-Type': Config.ContentType.FORM,
        'User-Agent': Config.USER_AGENT
      },
      method: 'POST',
      json: true,
      form: `message=${encodeURIComponent(JSON.stringify(message))}`
    }

    return payload;
  }

  private buildControlPayload(code: string, value: string): Request.Payload {
    let tokens = store.get('tokens');

    let header: Request.MessageHeader = {
      trcode: Config.Endpoints.CONTROL,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }

    let message: Request.Message = {
      header: header,
      body: {
        barcode: this.deviceId,
        funcList: [{
          comdVal: value,
          funcId: code
        }]
      }
    }

    let payload: Request.Payload = {
      uri: `${Config.BASE_URI}/${Config.Endpoints.CONTROL}.json`,
      headers: {
        'Content-Type': Config.ContentType.FORM,
        'User-Agent': Config.USER_AGENT
      },
      method: 'POST',
      json: true,
      form: `message=${encodeURIComponent(JSON.stringify(message))}`
    }

    return payload;
  }
}