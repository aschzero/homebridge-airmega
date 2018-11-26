import { Hap } from '../HAP';
import { Logger } from '../Logger';
import { HAP, PurifierResponse } from '../types';
import { Service } from './Service';

export class PurifierService extends Service {
  purifierService: HAP.Service;

  register(): HAP.Service {
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

    return this.purifierService;
  }

  getOrCreatePurifierService(): HAP.Service {
    let purifierService = this.accessory.getService(Hap.Service.AirPurifier);

    if (!purifierService) {
      purifierService = this.accessory.addService(Hap.Service.AirPurifier, this.purifier.name);
    }

    return purifierService;
  }

  async getActiveState(callback): Promise<void> {
    try {
      let status = await this.purifier.waitForStatusUpdate();

      if (status.power == PurifierResponse.Power.On) {
        callback(null, Hap.Characteristic.Active.ACTIVE);
      } else {
        callback(null, Hap.Characteristic.Active.INACTIVE);
      }
    } catch(e) {
      Logger.error('Unable to get active state', e);
      callback(e);
    }
  }

  async setActiveState(targetState, callback): Promise<void> {
    // Only toggle power when new state is different.
    // Prevents extraneous calls especially when changing
    // the fan speed (setRotationSpeed ensures device is on).
    if (Number(this.purifier.power) == targetState) {
      callback(null);
      return;
    }

    try {
      await this.client.setPower(this.purifier.id, targetState);

      if (targetState) {
        this.purifierService.setCharacteristic(Hap.Characteristic.CurrentAirPurifierState, Hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
        this.purifier.power = PurifierResponse.Power.On;
      } else {
        this.purifierService.setCharacteristic(Hap.Characteristic.CurrentAirPurifierState, Hap.Characteristic.CurrentAirPurifierState.INACTIVE);
        this.purifier.power = PurifierResponse.Power.Off;
      }

      // Update light accessory to accurately reflect new state after toggling power
      let lightService = this.accessory.getService(Hap.Service.Lightbulb);
      if (lightService) {
        lightService.getCharacteristic(Hap.Characteristic.On).updateValue(targetState);
      }

      callback(null);
    } catch(e) {
      Logger.error('Unable to toggle power', e);
      callback(e);
    }
  }

  async getCurrentAirPurifierState(callback): Promise<void> {
    try {
      let status = await this.purifier.waitForStatusUpdate();

      if (status.power == PurifierResponse.Power.Off) {
        callback(null, Hap.Characteristic.CurrentAirPurifierState.INACTIVE);
        return;
      }

      if (status.mode == PurifierResponse.Mode.Sleep ||
          status.mode == PurifierResponse.Mode.AutoSleep) {
        callback(null, Hap.Characteristic.CurrentAirPurifierState.IDLE);
        return;
      }

      callback(null, Hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
    } catch(e) {
      Logger.error('Unable to get current state', e);
      callback(e);
    }
  }

  async getTargetPurifierState(callback): Promise<void> {
    try {
      let status = await this.purifier.waitForStatusUpdate();

      if (status.mode == PurifierResponse.Mode.Auto) {
        callback(null, Hap.Characteristic.TargetAirPurifierState.AUTO);
      } else {
        callback(null, Hap.Characteristic.TargetAirPurifierState.MANUAL);
      }
    } catch(e) {
      Logger.error('Unable to get target state', e);
      callback(e);
    }
  }

  async setTargetPurifierState(targetState, callback): Promise<void> {
    try {
      await this.client.setMode(this.purifier.id, targetState);

      if (targetState) {
        this.purifier.mode = PurifierResponse.Mode.Auto;
      } else {
        this.purifier.mode = PurifierResponse.Mode.Manual;
      }

      callback(null);
    } catch(e) {
      Logger.error('Unable to set new state', e);
      callback(e);
    }
  }

  async getRotationSpeed(callback): Promise<void> {
    try {
      let status = await this.purifier.waitForStatusUpdate();

      let intervals = {1: 20, 2: 50, 3: 100};
      let fanSpeed = intervals[status.fan];

      callback(null, fanSpeed);
    } catch(e) {
      Logger.error('Unable to get fan speed', e);
      callback(e);
    }
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

      this.purifierService.getCharacteristic(Hap.Characteristic.TargetAirPurifierState)
                          .updateValue(Hap.Characteristic.TargetAirPurifierState.MANUAL);

      callback(null);
    } catch(e) {
      Logger.error('Unable to set fan speed', e);
      callback(e);
    }
  }
}