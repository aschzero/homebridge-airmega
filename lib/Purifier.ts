import { Client } from './Client';
import { AirQuality, Fan, Light, Mode, Power, Status } from './interfaces/PurifierStatus';
import { Logger } from './Logger';
import { Deferred } from './util/Deferred';

export class Purifier {
  id: string;
  name: string;
  power: Power;
  light: Light;
  fan: Fan;
  mode: Mode;
  airQuality: AirQuality;

  client: Client;

  deferredStatus: Deferred<Status>;
  statusUpdateLocked: boolean;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.client = new Client();

    this.deferredStatus = new Deferred<Status>();
    this.statusUpdateLocked = false;
  }

  setStatus(status: Status): void {
    this.power = status.power;
    this.light = status.light;
    this.fan = status.fan;
    this.mode = status.mode;
    this.airQuality = status.airQuality;
  }

  async waitForStatusUpdate(): Promise<Status> {
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
        this.deferredStatus = new Deferred<Status>();
      }, 1000);

      this.statusUpdateLocked = false;

      return status;
    } catch(e) {
      Logger.error('Unable to update purifier status', e);
    }
  }
}