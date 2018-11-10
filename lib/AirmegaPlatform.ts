import { Authenticator } from './Authenticator';
import { Hap } from './HAP';
import { Logger } from './Logger';
import { Purifier } from './Purifier';
import { AirQualityAccessory } from './accessories/AirQualityAccessory';
import { FilterAccessory } from './accessories/FilterAccessory';
import { LightAccessory } from './accessories/LightAccessory';
import { PurifierAccessory } from './accessories/PurifierAccessory';
import { HAP } from './types';

export class AirmegaPlatform {
  platform: HAP.Platform;
  accessories: HAP.Accessory[];
  log: HAP.Log;

  constructor(log: HAP.Log, config: HAP.AccessoryConfig, platform: HAP.Platform) {
    Logger.setLogger(log, config['debug']);

    this.platform = platform;
    this.accessories = [];

    if (!this.platform) return;

    this.platform.on('didFinishLaunching', () => {
      let username = config['username'];
      let password = config['password'];

      if (!username || !password) {
        throw Error('Username and password fields are required in config');
      }

      try {
        this.retrievePurifiers(username, password);
      } catch(e) {
        Logger.error('Unable to retrieve purifiers', e);
      }
    });
  }

  async retrievePurifiers(username: string, password: string): Promise<void> {
    let authenticator = new Authenticator();

    Logger.log('Authenticating...');

    try {
      await authenticator.login(username, password);
    } catch(e) {
      Logger.error('Unable to login', e);
      return;
    }

    try {
      authenticator.listPurifiers().forEach(purifier => {
        this.registerAccessory(purifier);
      });
    } catch(e) {
      Logger.error('Unable to retrieve purifiers', e);
      return;
    }
  }

  configureAccessory(accessory: HAP.Accessory): void {
    this.accessories[accessory.UUID] = accessory;
  }

  registerAccessory(purifier: Purifier): void {
    let uuid: string = Hap.UUIDGen.generate(purifier.name);
    let accessory: HAP.Accessory;

    if (this.accessories[uuid]) {
      accessory = this.accessories[uuid];
    } else {
      accessory = new Hap.Accessory(purifier.name, uuid);
      this.accessories[accessory.UUID] = accessory;

      this.platform.registerPlatformAccessories('homebridge-airmega', 'Airmega', [accessory]);
    }

    this.registerAccessories(purifier, accessory);
  }

  registerAccessories(purifier: Purifier, accessory: HAP.Accessory): void {
    accessory.getService(Hap.Service.AccessoryInformation)
      .setCharacteristic(Hap.Characteristic.Manufacturer, 'Coway')
      .setCharacteristic(Hap.Characteristic.Model, 'Airmega')
      .setCharacteristic(Hap.Characteristic.SerialNumber, purifier.id);

    let purifierAccessory = new PurifierAccessory(purifier, accessory);
    purifierAccessory.registerServices();

    let airQualityAccessory = new AirQualityAccessory(purifier, accessory);
    airQualityAccessory.registerServices();

    let filterAccessory = new FilterAccessory(purifier, accessory);
    filterAccessory.registerServices();

    let lightAccessory = new LightAccessory(purifier, accessory);
    lightAccessory.registerServices();

    Logger.log(`Created accessories for ${purifier.name}`);
  }
}