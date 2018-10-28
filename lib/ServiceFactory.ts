import { AirQualityService } from './AirQualityService';
import { FilterService } from './FilterService';
import { LightService } from './LightService';
import { Purifier } from './Purifier';
import { PurifierService } from './PurifierService';
import { HAP, PurifierResponse } from './types';
import { Client } from './Client';

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
    this.purifierService.registerServices();
    this.airQualityService.registerServices();
    this.filterService.registerServices();
    this.lightService.registerServices();
  }
}