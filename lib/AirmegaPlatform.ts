import { Authenticator } from './Authenticator';
import { Hap } from './HAP';
import { Logger } from './Logger';
import { Purifier } from './Purifier';
import { AirQualityService } from './services/AirQualityService';
import { FilterService } from './services/FilterService';
import { LightbulbService } from './services/LightbulbService';
import { PurifierService } from './services/PurifierService';
import { HAP } from './types';

export class AirmegaPlatform {
  platform: HAP.Platform;
  accessories: Map<string, HAP.Accessory>;
  log: HAP.Log;

  constructor(log: HAP.Log, config: HAP.AccessoryConfig, platform: HAP.Platform) {
    Logger.setLogger(log, config['debug']);

    this.platform = platform;
    this.accessories = new Map<string, HAP.Accessory>();

    if (!this.platform) return;

    this.platform.on('didFinishLaunching', () => {
      let username = config['username'];
      let password = config['password'];

      if (!username || !password) {
        throw Error('Username and password fields are required in config');
      }

      Logger.log('Authenticating...');

      try {
        let authenticator = new Authenticator();

        authenticator.login(username, password).then(purifiers => {
          purifiers.forEach(purifier => this.registerAccessory(purifier, config));
        });
      } catch(e) {
        Logger.error('Unable to authenticate', e);
      }
    });
  }

  configureAccessory(accessory: HAP.Accessory): void {
    this.accessories.set(accessory.UUID, accessory);
  }

  registerAccessory(purifier: Purifier, config: HAP.AccessoryConfig): void {
    let uuid: string = Hap.UUIDGen.generate(purifier.name);
    let accessory = this.accessories.get(uuid);

    if (!accessory) {
      accessory = new Hap.Accessory(purifier.name, uuid);
      this.accessories.set(accessory.UUID, accessory);

      this.platform.registerPlatformAccessories('homebridge-airmega', 'Airmega', [accessory]);
    }

    this.registerServices(purifier, accessory, config);

    Logger.log(`Found ${purifier.name}`);
  }

  registerServices(purifier: Purifier, accessory: HAP.Accessory, config: HAP.AccessoryConfig): void {
    accessory.getService(Hap.Service.AccessoryInformation)
      .setCharacteristic(Hap.Characteristic.Manufacturer, 'Coway')
      .setCharacteristic(Hap.Characteristic.Model, 'Airmega')
      .setCharacteristic(Hap.Characteristic.SerialNumber, purifier.id);

    let purifierService = new PurifierService(purifier, accessory);
    let airQualityService = new AirQualityService(purifier, accessory);
    let lightService = new LightbulbService(purifier, accessory);
    let filterService = new FilterService(purifier, accessory);

    purifierService.register();
    airQualityService.register();
    filterService.register();

    if (this.shouldExcludeAccessory(config, 'lightbulb')) {
      this.removeService(accessory, Hap.Service.Lightbulb);
    } else {
      lightService.register();
    }
  }

  shouldExcludeAccessory(config: HAP.AccessoryConfig, name: string) {
    if (!config.hasOwnProperty('exclude')) return false;

    return config['exclude'].includes(name);
  }

  removeService(accessory: HAP.Accessory, service: HAP.Service): void {
    accessory.services.forEach(existingService => {
      if (existingService.UUID == service.UUID) {
        accessory.removeService(existingService);
      }
    });
  }
}