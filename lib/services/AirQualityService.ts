import { HAP } from '../HAP';
import { Logger } from '../Logger';
import { PurifierResponse } from '../types';
import { AbstractService } from './AbstractService';
import { Service } from '../interfaces/HAP';

export class AirQualityService extends AbstractService {

  register(): void {
    let airQualityService = this.getOrCreateAirQualityService();

    airQualityService.getCharacteristic(HAP.Characteristic.AirQuality)
      .on('get', this.getAirQuality.bind(this));
  }

  getOrCreateAirQualityService(): Service {
    let airQualityService = this.accessory.getService(HAP.Service.AirQualitySensor);

    if (!airQualityService) {
      airQualityService = this.accessory.addService(HAP.Service.AirQualitySensor, this.purifier.name);
    }

    return airQualityService;
  }

  async getAirQuality(callback): Promise<void> {
    let result;

    try {
      let status = await this.purifier.waitForStatusUpdate();

      switch (status.airQuality) {
        case PurifierResponse.AirQuality.Excellent:
          result = HAP.Characteristic.AirQuality.EXCELLENT;
          break;
        case PurifierResponse.AirQuality.Good:
          result = HAP.Characteristic.AirQuality.GOOD;
          break;
        case PurifierResponse.AirQuality.Fair:
          result = HAP.Characteristic.AirQuality.FAIR;
          break;
        case PurifierResponse.AirQuality.Inferior:
          result = HAP.Characteristic.AirQuality.INFERIOR;
          break;
      }

      callback(null, result);
    } catch(e) {
      Logger.error('Unable to get air quality', e);
      callback(e);
    }
  }
}