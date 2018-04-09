import { Platform } from './interfaces/Platform';
import { Logger } from './Logger';
import { AccessoryConfig } from './interfaces/AccessoryConfig';
import { Authenticator } from './APIAuthenticator';
import { Hap } from './HAP';
import { Accessory, Log } from './interfaces/HAP';
import { PurifierProperties, PurifierMetadataProperties } from './interfaces/Purifier';
import { PurifierAccessory } from './PurifierAccessory';

export class AirmegaPlatform {
  platform: Platform;
  accessories: Array<Accessory>;
  registeredAccessories: Map<string, Accessory>;
  log: Log;  

  constructor(log: Log, config: AccessoryConfig, platform: Platform) {
    Logger.setLog(log);

    this.platform = platform;
    this.accessories = [];
    this.registeredAccessories = new Map<string, Accessory>();

    if (this.platform) {
      this.platform.on('didFinishLaunching', () => {
        let email = config['email'];
        let password = config['password'];

        if (!email || !password) {
          throw Error('email and password fields are required in config');
        }

        Authenticator.authenticate(email, password, this.log).then((purifiers) => {
          purifiers.forEach(purifier => this.addAccessory(purifier));
        });
      });
    }
  }

  configureAccessory(accessory: Accessory): void {
    accessory.updateReachability(false);
    
    this.registeredAccessories.set(accessory.UUID, accessory);
  }

  addAccessory(properties: PurifierMetadataProperties): void {
    let uuid: string = Hap.UUIDGen.generate(properties.aliasName);
    let accessory: Accessory;

    if (this.registeredAccessories.get(uuid)) {
      accessory = this.registeredAccessories.get(uuid);
    } else {
      accessory = new Hap.Accessory(properties.aliasName, uuid);
    }

    let purifierAccessory = new PurifierAccessory(accessory, properties);

    accessory.on('identify', (paired, callback) => {
      callback();
    });

    this.accessories.push(accessory);
    if (!this.registeredAccessories.get(uuid)) {
      this.platform.registerPlatformAccessories('homebridge-airmega', 'Airmega', [accessory]);
    }
  }
}