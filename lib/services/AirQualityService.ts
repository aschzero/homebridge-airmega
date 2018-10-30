import { Hap } from '../HAP';
import { Service } from './Service';
import { HAP, PurifierResponse } from '../types';

export class AirQualityService extends Service {

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
    let status = await this.deferredStatus;
    let result;

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