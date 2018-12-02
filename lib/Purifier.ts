import { Client } from './Client';
import { AirQuality, Fan, Light, Mode, Power, Status } from './interfaces/PurifierStatus';
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
      this.clearStatusUpdateLock();

      return status;
    } catch(e) {
      this.deferredStatus.reject(e);
      this.clearStatusUpdateLock();

      throw new Error(e);
    }
  }

  clearStatusUpdateLock(): void {
    setTimeout(() => {
      this.deferredStatus = new Deferred<Status>();
      this.statusUpdateLocked = false;
    }, 1000);
  }
}