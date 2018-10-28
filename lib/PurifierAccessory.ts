import { Client } from './Client';
import { Hap } from './HAP';
import { Logger } from './Logger';
import { Purifier } from './Purifier';
import { HAP, PurifierResponse } from './types';
import { AirQualityService } from './AirQualityService';
import { FilterService } from './FilterService';
import { LightService } from './LightService';

export class PurifierAccessory {
  client: Client;
  purifier: Purifier;
  accessory: HAP.Accessory;

  purifierService: HAP.Service;
  airQualityService: AirQualityService;

  constructor(accessory: HAP.Accessory, purifier: Purifier) {
    this.purifier = purifier;
    this.accessory = accessory;
    this.client = new Client();

    this.setupAccessoryInformationServiceCharacteristics();
    this.setupPurifierServiceCharacteristics();

    let airQualityService = new AirQualityService(this.purifier, this.accessory);
    let filterService = new FilterService(this.purifier, this.accessory);
    let lightService = new LightService(this.purifier, this.accessory);

    airQualityService.registerServices();
    filterService.registerServices();
    lightService.registerServices();

    this.accessory.updateReachability(true);

    Logger.log(`Created accessory for '${this.purifier.name}'`);
  }

  setupAccessoryInformationServiceCharacteristics(): void {
    this.accessory.getService(Hap.Service.AccessoryInformation)
      .setCharacteristic(Hap.Characteristic.Manufacturer, 'Coway')
      .setCharacteristic(Hap.Characteristic.Model, 'Airmega')
      .setCharacteristic(Hap.Characteristic.SerialNumber, this.purifier.id);
  }

  setupPurifierServiceCharacteristics(): void {
    this.purifierService = this.getOrCreatePurifierService();

    this.purifierService.getCharacteristic(Hap.Characteristic.Active)
      .on('get', this.getActiveState.bind(this))
      .on('set', this.setActiveState.bind(this));

    this.purifierService.getCharacteristic(Hap.Characteristic.CurrentAirPurifierState)
      .on('get', this.getCurrentAirPurifierState.bind(this));

    this.purifierService.getCharacteristic(Hap.Characteristic.TargetAirPurifierState)
      .on('get', this.getTargetPurifierState.bind(this))
      .on('set', this.setTargetPurifierState.bind(this));

    this.purifierService.getCharacteristic(Hap.Characteristic.RotationSpeed)
      .on('get', this.getRotationSpeed.bind(this))
      .on('set', this.setRotationSpeed.bind(this));
  }

  getOrCreatePurifierService(): HAP.Service {
    let purifierService = this.accessory.getService(Hap.Service.AirPurifier);

    if (!purifierService) {
      purifierService = this.accessory.addService(Hap.Service.AirPurifier, this.purifier.name);
    }

    return purifierService;
  }

  async getActiveState(callback): Promise<void> {
    let status = await this.client.getStatus(this.purifier.id);

    if (status.power == PurifierResponse.Power.On) {
      callback(null, Hap.Characteristic.Active.ACTIVE);
    } else {
      callback(null, Hap.Characteristic.Active.INACTIVE);
    }
  }

  async setActiveState(targetState, callback) {
    // Only toggle power when new state is different.
    // Prevents extraneous calls especially when changing
    // the fan speed (setRotationSpeed ensures device is on).
    if (Number(this.purifier.power) == targetState) {
      callback(null);
      return;
    }

    Logger.log(`${this.purifier.name} is turning ${targetState ? 'on' : 'off'}...`);

    try {
      await this.client.setPower(this.purifier.id, targetState);
    } catch(e) {
      Logger.error('Unable to toggle power', e);
      callback(e);
    }

    // Need to update the current purifier state characteristic here
    // otherwise it hangs on 'Turning on...'/'Turning off...'
    if (targetState) {
      this.purifierService.getCharacteristic(Hap.Characteristic.CurrentAirPurifierState)
                          .updateValue(Hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);

      this.purifier.power = PurifierResponse.Power.On;
    } else {
      this.purifierService.getCharacteristic(Hap.Characteristic.CurrentAirPurifierState)
                          .updateValue(Hap.Characteristic.CurrentAirPurifierState.INACTIVE);

      this.purifier.power = PurifierResponse.Power.Off;
    }

    Logger.log(this.purifier.name, `has been turned ${targetState ? 'on' : 'off'}`);

    callback(null);
  }

  async getCurrentAirPurifierState(callback): Promise<void> {
    let status = await this.client.getStatus(this.purifier.id);
    this.purifier.setStatus(status);

    if (status.power == PurifierResponse.Power.Off) {
      callback(null, Hap.Characteristic.CurrentAirPurifierState.INACTIVE);
      return;
    }

    if (status.state == PurifierResponse.State.Sleep || status.state == PurifierResponse.State.AutoSleep) {
      callback(null, Hap.Characteristic.CurrentAirPurifierState.IDLE);
      return;
    }

    callback(null, Hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
  }

  async getTargetPurifierState(callback): Promise<void> {
    let status = await this.client.getStatus(this.purifier.id);

    if (status.state == PurifierResponse.State.Auto) {
      callback(null, Hap.Characteristic.TargetAirPurifierState.AUTO);
    } else {
      callback(null, Hap.Characteristic.TargetAirPurifierState.MANUAL);
    }
  }

  async setTargetPurifierState(targetState, callback): Promise<void> {
    try {
      await this.client.setMode(this.purifier.id, targetState);

      if (targetState) {
        this.purifier.state = PurifierResponse.State.Auto;
      } else {
        this.purifier.state = PurifierResponse.State.Manual;
      }

      Logger.log(this.purifier.name, `set to ${targetState ? 'auto' : 'manual'}`);

      callback(null);
    } catch(e) {
      Logger.error('Unable to set new state', e);
      callback(e);
    }
  }

  async getRotationSpeed(callback): Promise<void> {
    let status = await this.client.getStatus(this.purifier.id);

    let intervals = {1: 20, 2: 50, 3: 100};
    let fanSpeed = intervals[status.fan];

    callback(null, fanSpeed);
  }

  async setRotationSpeed(targetState, callback) {
    let targetSpeed;
    let ranges = {};

    ranges[PurifierResponse.Fan.Low] = [0, 40];
    ranges[PurifierResponse.Fan.Medium] = [40, 70];
    ranges[PurifierResponse.Fan.High] = [70, 100];

    for (var key in ranges) {
      var currentSpeed = ranges[key];

      if (targetState > currentSpeed[0] && targetState <= currentSpeed[1]) {
        targetSpeed = key;
        break;
      }
    }

    try {
      await this.client.setFanSpeed(this.purifier.id, targetSpeed);

      this.purifierService.getCharacteristic(Hap.Characteristic.CurrentAirPurifierState)
                          .updateValue(Hap.Characteristic.CurrentAirPurifierState.MANUAL);

      callback(null);
    } catch(e) {
      Logger.error('Unable to set fan speed', e);
      callback(e);
    }
  }
}