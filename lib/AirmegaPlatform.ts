import { Communicator } from './api/Communicator';
import { Authenticator } from './api/Authenticator';
import { AccessoryConfig } from './definitions/AccessoryConfig';
import { Accessory, Log } from './definitions/HAP';
import { Platform } from './definitions/Platform';
import { PurifierMetadata } from './definitions/Purifier';
import { Logger } from './HALogger';
import { Hap } from './HAP';
import { PurifierAccessory } from './PurifierAccessory';

export class AirmegaPlatform {
  platform: Platform;
  accessories: Array<Accessory>;
  registeredAccessories: Map<string, Accessory>;
  log: Log;

  constructor(log: Log, config: AccessoryConfig, platform: Platform) {
    Logger.setLogger(log, config['debug']);

    this.platform = platform;
    this.accessories = [];
    this.registeredAccessories = new Map<string, Accessory>();

    if (this.platform) {
      this.platform.on('didFinishLaunching', () => {
        let username = config['username'];
        let password = config['password'];

        if (!username || !password) {
          throw Error('username and password fields are required in config');
        }

        try {
          Logger.log('Authenticating...');
          this.retrievePurifiers(username, password);
        } catch(e) {
          Logger.log(`Unable to retrieve purifiers: ${e}`);
        }
      });
    }
  }

  async retrievePurifiers(username: string, password: string) {
    let authenticator = new Authenticator();
    let communicator = new Communicator();

    await authenticator.authenticate(username, password);

    let purifiers = await communicator.getPurifiers();
    purifiers.forEach(purifier => {
      Logger.log(`Found ${purifier.nickname}`);
      this.addAccessory(purifier);
    });
  }

  configureAccessory(accessory: Accessory): void {
    accessory.updateReachability(false);

    this.registeredAccessories.set(accessory.UUID, accessory);
  }

  addAccessory(purifier: PurifierMetadata): void {
    let uuid: string = Hap.UUIDGen.generate(purifier.nickname);
    let accessory: Accessory;

    if (this.registeredAccessories.get(uuid)) {
      accessory = this.registeredAccessories.get(uuid);
    } else {
      accessory = new Hap.Accessory(purifier.nickname, uuid);
    }

    new PurifierAccessory(accessory, purifier);

    accessory.on('identify', (paired, callback) => {
      callback();
    });

    this.accessories.push(accessory);
    if (!this.registeredAccessories.get(uuid)) {
      this.platform.registerPlatformAccessories('homebridge-airmega', 'Airmega', [accessory]);
    }
  }
}