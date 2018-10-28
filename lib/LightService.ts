import { Hap } from './HAP';
import { Logger } from './Logger';
import { Service } from './Service';
import { HAP, PurifierResponse } from './types';

export class LightService extends Service {

  registerServices(): void {
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
    let status = await this.client.getStatus(this.purifier.id);

    callback(null, status.light == PurifierResponse.Light.On);
  }

  async setLightIndicator(targetState, callback): Promise<void> {
    Logger.log(this.purifier.name, `light turning ${(targetState ? 'on' : 'off')}...`);

    try {
      await this.client.setLight(this.purifier.id, targetState);

      Logger.log(this.purifier.name, `light is ${(targetState ? 'on' : 'off')}`);
      callback(null);
    } catch(e) {
      Logger.error('Unable to control light', e);
      callback(e);
    }
  }
}