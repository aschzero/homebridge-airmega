import { HAP } from '../HAP';
import { Service } from '../interfaces/HAP';
import { Fan, Mode, Power } from '../interfaces/PurifierStatus';
import { Logger } from '../Logger';
import { AbstractService } from './AbstractService';

export class PurifierService extends AbstractService {
  purifierService: Service;

  register(): void {
    this.purifierService = this.getOrCreatePurifierService();

    this.purifierService.getCharacteristic(HAP.Characteristic.Active)
      .on('get', this.getActiveState.bind(this))
      .on('set', this.setActiveState.bind(this));

    this.purifierService.getCharacteristic(HAP.Characteristic.CurrentAirPurifierState)
      .on('get', this.getCurrentAirPurifierState.bind(this));

    this.purifierService.getCharacteristic(HAP.Characteristic.TargetAirPurifierState)
      .on('get', this.getTargetPurifierState.bind(this))
      .on('set', this.setTargetPurifierState.bind(this));

    this.purifierService.getCharacteristic(HAP.Characteristic.RotationSpeed)
      .on('get', this.getRotationSpeed.bind(this))
      .on('set', this.setRotationSpeed.bind(this));
  }

  getOrCreatePurifierService(): Service {
    let purifierService = this.accessory.getService(HAP.Service.AirPurifier);

    if (!purifierService) {
      purifierService = this.accessory.addService(HAP.Service.AirPurifier, this.purifier.name);
    }

    return purifierService;
  }

  async getActiveState(callback): Promise<void> {
    try {
      let status = await this.purifier.waitForStatusUpdate();

      if (status.power == Power.On) {
        callback(null, HAP.Characteristic.Active.ACTIVE);
      } else {
        callback(null, HAP.Characteristic.Active.INACTIVE);
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
        this.purifierService.setCharacteristic(HAP.Characteristic.CurrentAirPurifierState, HAP.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
        this.purifier.power = Power.On;
      } else {
        this.purifierService.setCharacteristic(HAP.Characteristic.CurrentAirPurifierState, HAP.Characteristic.CurrentAirPurifierState.INACTIVE);
        this.purifier.power = Power.Off;
      }

      // Update light accessory to accurately reflect new state after toggling power
      let lightService = this.accessory.getService(HAP.Service.Lightbulb);
      if (lightService) {
        lightService.getCharacteristic(HAP.Characteristic.On).updateValue(targetState);
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

      if (status.power == Power.Off) {
        callback(null, HAP.Characteristic.CurrentAirPurifierState.INACTIVE);
        return;
      }

      if (status.mode == Mode.Sleep ||
          status.mode == Mode.AutoSleep) {
        callback(null, HAP.Characteristic.CurrentAirPurifierState.IDLE);
        return;
      }

      callback(null, HAP.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
    } catch(e) {
      Logger.error('Unable to get current state', e);
      callback(e);
    }
  }

  async getTargetPurifierState(callback): Promise<void> {
    try {
      let status = await this.purifier.waitForStatusUpdate();

      if (status.mode == Mode.Auto) {
        callback(null, HAP.Characteristic.TargetAirPurifierState.AUTO);
      } else {
        callback(null, HAP.Characteristic.TargetAirPurifierState.MANUAL);
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
        this.purifier.mode = Mode.Auto;
      } else {
        this.purifier.mode = Mode.Manual;
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

    ranges[Fan.Low] = [0, 40];
    ranges[Fan.Medium] = [40, 70];
    ranges[Fan.High] = [70, 100];

    for (var key in ranges) {
      var currentSpeed = ranges[key];

      if (targetState > currentSpeed[0] && targetState <= currentSpeed[1]) {
        targetSpeed = key;
        break;
      }
    }

    try {
      await this.client.setFanSpeed(this.purifier.id, targetSpeed);

      this.purifierService.getCharacteristic(HAP.Characteristic.TargetAirPurifierState)
                          .updateValue(HAP.Characteristic.TargetAirPurifierState.MANUAL);

      callback(null);
    } catch(e) {
      Logger.error('Unable to set fan speed', e);
      callback(e);
    }
  }
}