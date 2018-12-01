import { AirmegaPlatform } from './lib/AirmegaPlatform';
import { HAP } from './lib/HAP';

export = (homebridge) => {
  HAP.Accessory = homebridge.platformAccessory;
  HAP.Service = homebridge.hap.Service;
  HAP.Characteristic = homebridge.hap.Characteristic;
  HAP.UUID = homebridge.hap.uuid;

  homebridge.registerPlatform('homebridge-airmega', 'Airmega', AirmegaPlatform, true);
}