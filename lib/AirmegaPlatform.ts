import { Authenticator } from './api/Authenticator';
import { PurifierCommunicator } from './api/PurifierCommunicator';
import { HAP, Purifier } from './types';
import { Logger } from './HALogger';
import { Hap } from './HAP';
import { PurifierAccessory } from './PurifierAccessory';

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

    if (this.platform) {
      this.platform.on('didFinishLaunching', () => {
        let username = config['username'];
        let password = config['password'];

        if (!username || !password) {
          throw Error('username and password fields are required in config');
        }

        try {
          this.setup(username, password);
        } catch(e) {
          Logger.log(`Unable to retrieve purifiers: ${e}`);
        }
      });
    }
  }

  async setup(username: string, password: string): Promise<void> {
    let authenticator = new Authenticator();
    let communicator = new PurifierCommunicator();

    Logger.log('Authenticating...');

    let state = await authenticator.getStateId();
    await authenticator.authenticate(username, password, state);

    Logger.log('Getting purifiers...');

    let purifiers = await communicator.getPurifiers();
    purifiers.forEach(purifier => {
      Logger.log(`Found '${purifier.nickname}'`);
      this.addAccessory(purifier);
    });
  }

  configureAccessory(accessory: HAP.Accessory): void {
    accessory.updateReachability(false);

    this.registeredAccessories.set(accessory.UUID, accessory);
  }

  addAccessory(purifier: Purifier.Metadata): void {
    let uuid: string = Hap.UUIDGen.generate(purifier.nickname);
    let accessory: HAP.Accessory;

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