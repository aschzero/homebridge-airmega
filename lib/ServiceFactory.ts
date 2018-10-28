import { AirQualityService } from './AirQualityService';
import { FilterService } from './FilterService';
import { LightService } from './LightService';
import { Purifier } from './Purifier';
import { PurifierService } from './PurifierService';
import { Service } from './Service';
import { HAP } from './types';

export class ServiceFactory {
  static services: Service[];

  purifierService: PurifierService;
  airQualityService: AirQualityService;
  filterService: FilterService;
  lightService: LightService;

  constructor(purifier: Purifier, accessory: HAP.Accessory) {
    this.purifierService = new PurifierService(purifier, accessory);
    this.airQualityService = new AirQualityService(purifier, accessory);
    this.filterService = new FilterService(purifier, accessory);
    this.lightService = new LightService(purifier, accessory);

    ServiceFactory.services = [
      this.purifierService,
      this.airQualityService,
      this.filterService,
      this.lightService
    ];
  }

  registerServices(): void {
    this.purifierService.registerServices();
    this.airQualityService.registerServices();
    this.filterService.registerServices();
    this.lightService.registerServices();
  }
}