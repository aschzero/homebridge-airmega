import { Communicator } from './Communicator';
import { Config } from './Config';
import { Logger } from './HALogger';
import { Purifier, Request } from './types';

export class PurifierCommunicator extends Communicator {
  deviceId: string;

  constructor(deviceId?: string) {
    super();
    this.deviceId = deviceId;
  }

  async getPurifiers(): Promise<Purifier.Metadata[]> {
    let payload: Request.Payload = this.buildPurifierListPayload();
    let response = await this.sendRequest(payload);
    let purifiers: Purifier.Metadata[] = response.body.deviceInfos.map(device => {
      return {
        nickname: device.dvcNick,
        barcode: device.barcode
      } as Purifier.Metadata;
    });

    return purifiers;
  }

  async getStatus(): Promise<Purifier.Status> {
    let payload: Request.Payload = this.buildStatusPayload(Config.Endpoints.STATUS);
    let response = await this.sendRequest(payload);

    let statusResponse = response.body.prodStatus[0];

    let status: Purifier.Status = {
      power: statusResponse['power'],
      light: statusResponse['light'],
      fan: statusResponse['airVolume'],
      state: statusResponse['prodMode'],
      airQuality: statusResponse['dustPollution']
    }

    Logger.debug('Status', status);

    return status;
  }

  async getFilterStatus(): Promise<Purifier.FilterStatus[]> {
    let payload: Request.Payload = this.buildStatusPayload(Config.Endpoints.FILTERS);
    let response = await this.sendRequest(payload);

    let filterStatuses = response.body.filterList.map(filter => {
      let filterStatus: Purifier.FilterStatus = {
        name: filter.filterName,
        lifeLevel: filter.filterPer
      }

      return filterStatus;
    })

    Logger.debug('Filter status', filterStatuses);

    return filterStatuses;
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

  async setLight(on: boolean): Promise<void> {
    let value = on ? '2' : '0';
    let payload = this.buildControlPayload(Config.Codes.LIGHT, value);

    try {
      await this.sendRequest(payload);
    } catch(e) {
      Logger.log(`Unable to set light: ${e}`);
    }
  }

  private buildPurifierListPayload(): Request.Payload {
    let endpoint = Config.Endpoints.DEVICE_LIST;
    let messageHeader: Request.MessageHeader = this.buildMessageHeader(endpoint);

    let message: Request.Message = {
      header: messageHeader,
      body: {
        barcode: this.deviceId
      }
    }

    let payload = this.buildPayload(endpoint, message);

    return payload;
  }

  private buildStatusPayload(endpoint: string): Request.Payload {
    let messageHeader: Request.MessageHeader = this.buildMessageHeader(endpoint);

    let message: Request.Message = {
      header: messageHeader,
      body: {
        barcode: this.deviceId,
        dvcBrandCd: 'MG',
        prodName: 'AIRMEGA',
        stationCd: '',
        resetDttm: '',
        deviceType: '004'
      }
    }

    let payload = this.buildPayload(endpoint, message);

    return payload;
  }

  private buildControlPayload(code: string, value: string): Request.Payload {
    let endpoint = Config.Endpoints.CONTROL;
    let messageHeader: Request.MessageHeader = this.buildMessageHeader(endpoint);

    let message: Request.Message = {
      header: messageHeader,
      body: {
        barcode: this.deviceId,
        funcList: [{
          comdVal: value,
          funcId: code
        }]
      }
    }

    let payload = this.buildPayload(endpoint, message);

    return payload;
  }
}