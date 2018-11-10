import { Authenticator } from './Authenticator';
import { Hap } from './HAP';
import { Logger } from './Logger';
import { AirmegaAccessory } from './AirmegaAccessory';
import { Purifier } from './Purifier';

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

  registerAccessory(purifier: Purifier): void {
    let uuid: string = Hap.UUIDGen.generate(purifier.name);
    let accessory: HAP.Accessory;

    if (this.accessories[uuid]) {
      accessory = this.accessories[uuid];
    } else {
      accessory = new Hap.Accessory(purifier.name, uuid);

      this.platform.registerPlatformAccessories('homebridge-airmega', 'Airmega', [accessory]);
    }

    new AirmegaAccessory(accessory, purifier);
    this.accessories[uuid] = accessory;
  }

  configureAccessory(accessory: HAP.Accessory): void {
    this.accessories[accessory.UUID] = accessory;
  }
}