import { Client } from './Client';
import { Hap } from './HAP';
import { Purifier } from './Purifier';
import { HAP, PurifierResponse } from './types';

export class AirQualityService {
  client: Client;
  purifier: Purifier;
  accessory: HAP.Accessory;

  constructor(purifier: Purifier, accessory: HAP.Accessory) {
    this.purifier = purifier;
    this.accessory = accessory;
    this.client = new Client();
  }

  registerServices(): HAP.Service {
    let airQualityService = this.accessory.getService(Hap.Service.AirQualitySensor);

    if (!airQualityService) {
      airQualityService = this.accessory.addService(Hap.Service.AirQualitySensor, this.purifier.name);
    }

    airQualityService.getCharacteristic(Hap.Characteristic.AirQuality)
      .on('get', this.getAirQuality.bind(this));

    return airQualityService;
  }

  async getAirQuality(callback): Promise<void> {
    let result;
    let status = await this.client.getStatus(this.purifier.id);

    switch (status.airQuality) {
      case PurifierResponse.AirQuality.Excellent:
        result = Hap.Characteristic.AirQuality.EXCELLENT;
        break;
      case PurifierResponse.AirQuality.Good:
        result = Hap.Characteristic.AirQuality.GOOD;
        break;
      case PurifierResponse.AirQuality.Fair:
        result = Hap.Characteristic.AirQuality.FAIR;
        break;
      case PurifierResponse.AirQuality.Inferior:
        result = Hap.Characteristic.AirQuality.INFERIOR;
        break;
    }

    callback(null, result);
  }
}