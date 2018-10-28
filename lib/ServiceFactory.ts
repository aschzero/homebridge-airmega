import { AirQualityService } from './AirQualityService';
import { Client } from './Client';
import { FilterService } from './FilterService';
import { LightService } from './LightService';
import { Logger } from './Logger';
import { Purifier } from './Purifier';
import { PurifierService } from './PurifierService';
import { HAP } from './types';

export class ServiceFactory {
  client: Client;
  purifier: Purifier;

  purifierService: PurifierService;
  airQualityService: AirQualityService;
  filterService: FilterService;
  lightService: LightService;

  constructor(purifier: Purifier, accessory: HAP.Accessory) {
    this.client = new Client();
    this.purifier = purifier;

    this.purifierService = new PurifierService(this.purifier, accessory);
    this.airQualityService = new AirQualityService(this.purifier, accessory);
    this.filterService = new FilterService(this.purifier, accessory);
    this.lightService = new LightService(this.purifier, accessory);
  }

  registerServices() {
    this.registerUpdateHandlers();

    this.purifierService.registerServices();
    this.airQualityService.registerServices();
    this.filterService.registerServices();
    this.lightService.registerServices();
  }

  registerUpdateHandlers(): void {
    let statusUpdateHandler = this.updateStatus();

    this.purifierService.statusUpdateHandler = statusUpdateHandler;
    this.airQualityService.statusUpdateHandler = statusUpdateHandler;
    this.filterService.statusUpdateHandler = statusUpdateHandler;
    this.lightService.statusUpdateHandler = statusUpdateHandler;
  }

  async updateStatus() {
    try {
      let status = await this.client.getStatus(this.purifier.id);
      this.purifier.setStatus(status);

      return status;
    } catch(e) {
      Logger.error('Unable to update purifier status', e);
    }
  }
}