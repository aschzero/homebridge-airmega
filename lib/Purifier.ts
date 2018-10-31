import { PurifierResponse } from './types';
import { Client } from './Client';
import { Deferred } from './util/Deferred';
import { Logger } from './Logger';

export class Purifier {
  id: string;
  name: string;
  power: PurifierResponse.Power;
  light: PurifierResponse.Light;
  fan: PurifierResponse.Fan;
  state: PurifierResponse.State;
  airQuality: PurifierResponse.AirQuality;

  client: Client;

  deferredStatus: Deferred<PurifierResponse.Status>;
  statusUpdateLocked: boolean;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.client = new Client();

    this.deferredStatus = new Deferred<PurifierResponse.Status>();
    this.statusUpdateLocked = false;
  }

  setStatus(status: PurifierResponse.Status): void {
    this.power = status.power;
    this.light = status.light;
    this.fan = status.fan;
    this.state = status.state;
    this.airQuality = status.airQuality;
  }

  async waitForStatusUpdate(): Promise<PurifierResponse.Status> {
    if (this.statusUpdateLocked) {
      let status = await this.deferredStatus;
      return status;
    }

    this.statusUpdateLocked = true;

    try {
      let status = await this.client.getStatus(this.id);

      this.setStatus(status);
      this.deferredStatus.resolve(status);

      setTimeout(() => {
        this.deferredStatus = new Deferred<PurifierResponse.Status>();
      }, 1000);

      this.statusUpdateLocked = false;

      return status;
    } catch(e) {
      Logger.error('Unable to update purifier status', e);
    }
  }
}