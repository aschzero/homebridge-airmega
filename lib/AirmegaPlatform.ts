import { Authenticator } from './Authenticator';
import { Hap } from './HAP';
import { Logger } from './Logger';
import { PurifierAccessory } from './PurifierAccessory';
import { HAP, Purifier } from './types';

export class AirmegaPlatform {
  platform: HAP.Platform;
  accessories: Array<HAP.Accessory>;
  registeredAccessories: Map<string, HAP.Accessory>;
  log: HAP.Log;

  constructor(log: HAP.Log, config: HAP.AccessoryConfig, platform: HAP.Platform) {
    Logger.setLogger(log, config['debug']);

    this.platform = platform;
    this.accessories = [];
    this.registeredAccessories = new Map<string, HAP.Accessory>();

    if (!this.platform) return;

    this.platform.on('didFinishLaunching', () => {
      let username = config['username'];
      let password = config['password'];

      if (!username || !password) {
        throw Error('username and password fields are required in config');
      }

      try {
        this.getPurifiers(username, password);
      } catch(e) {
        Logger.error('Unable to retrieve purifiers', e);
      }
    });
  }

  async getPurifiers(username: string, password: string): Promise<void> {
    let authenticator = new Authenticator();

    Logger.log('Authenticating...');

    try {
      await authenticator.login(username, password);
    } catch(e) {
      Logger.error('Unable to login', e);
      return;
    }

    Logger.log('Retrieving purifiers...');

    try {
      authenticator.getPurifiers().forEach(purifier => {
        let accessory = this.addAccessory(purifier);
        new PurifierAccessory(accessory, purifier);
      });
    } catch(e) {
      Logger.error('Unable to retrieve purifiers', e);
      return;
    }
  }

  addAccessory(purifier: Purifier.Metadata): HAP.Accessory {
    let uuid: string = Hap.UUIDGen.generate(purifier.nickname);
    let accessory: HAP.Accessory;

    if (this.registeredAccessories.get(uuid)) {
      accessory = this.registeredAccessories.get(uuid);
    } else {
      accessory = new Hap.Accessory(purifier.nickname, uuid);

      this.platform.registerPlatformAccessories('homebridge-airmega', 'Airmega', [accessory]);
    }

    this.accessories.push(accessory);

    return accessory;
  }

  configureAccessory(accessory: HAP.Accessory): void {
    accessory.reachability = false;
    this.registeredAccessories.set(accessory.UUID, accessory);
  }
}