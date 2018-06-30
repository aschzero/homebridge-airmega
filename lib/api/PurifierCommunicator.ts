import * as request from 'request-promise';
import * as store from 'store';

import { Message, MessageHeader } from '../definitions/api/Message';
import { Payload } from '../definitions/api/Payload';
import { PurifierMetadata, PurifierStatus } from '../definitions/Purifier';
import { Store } from '../definitions/Store';
import { Logger } from '../HALogger';
import { Config } from './Config';

export class PurifierCommunicator {
  deviceId: string;

  constructor(deviceId?: string) {
    this.deviceId = deviceId;
  }

  async getPurifiers(): Promise<PurifierMetadata[]> {
    let payload: Payload = this.buildPayload(Config.Endpoints.DEVICE_LIST);

    try {
      let response = await this.sendRequest(payload);
      let purifiers: PurifierMetadata[] = response.body.deviceInfos.map(device => {
        return {
          nickname: device.dvcNick,
          barcode: device.barcode
        } as PurifierMetadata;
      });

      return purifiers;
    } catch(e) {
      Logger.log(`Unable to retrieve purifiers: ${e}`);
    }
  }

  async getStatus(): Promise<PurifierStatus> {
    let payload: Payload = this.buildPayload(Config.Endpoints.STATUS);

    let response = await this.sendRequest(payload);
    let statusResponse = response.body.controlStatus;

    let status: PurifierStatus = {
      on: (statusResponse['0001'] == '1'),
      lightOn: (statusResponse['0007'] == '2'),
      fanSpeed: statusResponse['0003'],
      auto: (statusResponse['0002'] == '1'),
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

  private async sendRequest(payload: Payload) {
    Logger.debug('Sending payload', payload);

    let response = await request(payload);
    Logger.debug('Response', response);

    return response;
  }

  private buildPayload(endpoint: string): Payload {
    let tokens: Store = store.get('tokens');

    let header: MessageHeader = {
      trcode: endpoint,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }

    let message: Message = {
      header: header,
      body: {
        barcode: this.deviceId
      }
    }

    let payload: Payload = {
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

  private buildControlPayload(code: string, value: string) {
    let tokens: Store = store.get('tokens');

    let header: MessageHeader = {
      trcode: Config.Endpoints.CONTROL,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }

    let message: Message = {
      header: header,
      body: {
        barcode: this.deviceId,
        funcList: [{
          comdVal: value,
          funcId: code
        }]
      }
    }

    let payload: Payload = {
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