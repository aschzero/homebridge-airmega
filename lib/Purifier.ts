import { Client } from './Client';
import { AirQuality, Fan, Light, Mode, Power, Status, FilterStatus } from './interfaces/PurifierStatus';
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
  deferredFilterStatus: Deferred<FilterStatus[]>;

  statusUpdateLocked: boolean;
  filterStatusUpdateLocked: boolean;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.client = new Client();

    this.deferredStatus = new Deferred<Status>();
    this.deferredFilterStatus = new Deferred<FilterStatus[]>();

    this.statusUpdateLocked = false;
    this.filterStatusUpdateLocked = false;
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

      return status;
    } catch(e) {
      this.deferredStatus.reject(e);
      throw new Error(e);
    } finally {
      setTimeout(() => {
        this.deferredStatus = new Deferred<Status>();
        this.statusUpdateLocked = false;
      }, 1000);
    }
  }

  async waitForFilterStatusUpdate(): Promise<FilterStatus[]> {
    if (this.statusUpdateLocked) {
      let status = await this.deferredFilterStatus;
      return status;
    }

    this.filterStatusUpdateLocked = true;

    try {
      let status = await this.client.getFilterStatus(this.id);
      this.deferredFilterStatus.resolve(status);

      return status;
    } catch(e) {
      this.deferredFilterStatus.reject(e);
      throw new Error(e);
    } finally {
      setTimeout(() => {
        this.deferredFilterStatus = new Deferred<FilterStatus[]>();
        this.filterStatusUpdateLocked = false;
      }, 1000);
    }
  }
}