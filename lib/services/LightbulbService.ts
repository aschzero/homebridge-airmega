import { HAP } from '../HAP';
import { Service } from '../interfaces/HAP';
import { Light, Power } from '../interfaces/PurifierStatus';
import { Logger } from '../Logger';
import { AbstractService } from './AbstractService';

export class LightbulbService extends AbstractService {

  register(): void {
    let lightService = this.getOrCreateLightbulbService();

    lightService.getCharacteristic(HAP.Characteristic.On)
      .on('get', this.getLightIndicator.bind(this))
      .on('set', this.setLightIndicator.bind(this));
  }

  getOrCreateLightbulbService(): Service {
    let lightbulbService = this.accessory.getService(HAP.Service.Lightbulb);

    if (!lightbulbService) {
      lightbulbService = this.accessory.addService(HAP.Service.Lightbulb, this.purifier.name);
    }

    return lightbulbService;
  }

  async getLightIndicator(callback): Promise<void> {
    let status = await this.purifier.waitForStatusUpdate();

    if (status.power == Power.Off) {
      callback(null, false);
      return;
    }

    callback(null, status.light == Light.On);
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