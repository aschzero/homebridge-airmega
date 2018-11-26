import { Hap } from '../HAP';
import { Logger } from '../Logger';
import { Service } from './Service';
import { HAP, PurifierResponse } from '../types';

export class LightbulbService extends Service {

  register(): void {
    let lightService = this.getOrCreateLightbulbService();

    lightService.getCharacteristic(Hap.Characteristic.On)
      .on('get', this.getLightIndicator.bind(this))
      .on('set', this.setLightIndicator.bind(this));
  }

  getOrCreateLightbulbService(): HAP.Service {
    let lightbulbService = this.accessory.getService(Hap.Service.Lightbulb);

    if (!lightbulbService) {
      lightbulbService = this.accessory.addService(Hap.Service.Lightbulb, this.purifier.name);
    }

    return lightbulbService;
  }

  async getLightIndicator(callback): Promise<void> {
    let status = await this.purifier.waitForStatusUpdate();

    if (status.power == PurifierResponse.Power.Off) {
      callback(null, false);
      return;
    }

    callback(null, status.light == PurifierResponse.Light.On);
  }

  async setLightIndicator(targetState, callback): Promise<void> {
    try {
      await this.client.setLight(this.purifier.id, targetState);

      callback(null);
    } catch(e) {
      Logger.error('Unable to control light', e);
      callback(e);
    }
  }
}