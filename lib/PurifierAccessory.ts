import { Client } from './Client';
import { Hap } from './HAP';
import { Logger } from './Logger';
import { Purifier } from './Purifier';
import { HAP, PurifierResponse } from './types';


export class PurifierAccessory {
  purifier: Purifier;
  client: Client;
  accessory: HAP.Accessory;
  purifierService: HAP.Service;

  constructor(accessory: HAP.Accessory, purifier: Purifier) {
    this.purifier = purifier;
    this.accessory = accessory;
    this.client = new Client();

    this.setupAccessoryInformationServiceCharacteristics();
    this.setupPurifierServiceCharacteristics();
    // this.setupAirQualityServiceCharacteristics();
    // this.setupFilterMaintenanceServiceCharacteristics();
    // this.setupLightbulbServiceCharacteristics();

    // this.updateStatus();
    this.accessory.updateReachability(true);

    Logger.log(`Created accessory for '${this.purifier.name}'`);
  }

  // async updateStatus() {
  //   try {
  //     this.status = await this.client.getStatus(this.purifier.id);
  //     let filterStatus = await this.client.getFilterStatus(this.purifier.id);

  //     this.preFilterStatus = filterStatus.find(filter => {
  //       return filter.name == Config.Filters.PRE_FILTER;
  //     });

  //     this.mainFilterStatus = filterStatus.find(filter => {
  //       return filter.name == Config.Filters.MAIN_FILTER;
  //     });
  //   } catch(e) {
  //     Logger.log(`Unable to update purifier status: ${e}`);
  //   }
  // }

  getOrCreatePurifierService(): HAP.Service {
    let purifierService = this.accessory.getService(Hap.Service.AirPurifier);

    if (!purifierService) {
      purifierService = this.accessory.addService(Hap.Service.AirPurifier, this.purifier.name);
    }

    return purifierService;
  }

  getOrCreateAirQualityService(): HAP.Service {
    let airQualityService = this.accessory.getService(Hap.Service.AirQualitySensor);

    if (!airQualityService) {
      airQualityService = this.accessory.addService(Hap.Service.AirQualitySensor, this.purifier.name);
    }

    return airQualityService;
  }

  // getOrCreatePreFilterService(): HAP.Service {
  //   let filterService = this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'pre');

  //   if (!filterService) {
  //     filterService = this.accessory.addService(Hap.Service.FilterMaintenance, 'Pre Filter', 'pre');
  //   }

  //   return filterService;
  // }

  // getOrCreateMainFilterService(): HAP.Service {
  //   let filterService = this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'main');

  //   if (!filterService) {
  //     filterService = this.accessory.addService(Hap.Service.FilterMaintenance, 'Max 2 Filter', 'main');
  //   }

  //   return filterService;
  // }

  // getOrCreateLightbulbService(): HAP.Service {
  //   let lightbulbService = this.accessory.getService(Hap.Service.Lightbulb);

  //   if (!lightbulbService) {
  //     lightbulbService = this.accessory.addService(Hap.Service.Lightbulb, this.purifier.name);
  //   }

  //   return lightbulbService;
  // }

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

  // setupAirQualityServiceCharacteristics(): void {
  //   let airQualityService = this.getOrCreateAirQualityService();

  //   airQualityService.getCharacteristic(Hap.Characteristic.AirQuality)
  //     .on('get', this.getAirQuality.bind(this));
  // }

  // setupFilterMaintenanceServiceCharacteristics(): void {
  //   this.getOrCreateMainFilterService();
  //   this.getOrCreatePreFilterService();

  // this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'main')
  //   .getCharacteristic(Hap.Characteristic.FilterChangeIndication)
  //   .on('get', this.getMainFilterChangeIndication.bind(this));

  // this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'main')
  //   .getCharacteristic(Hap.Characteristic.FilterLifeLevel)
  //   .on('get', this.getMainFilterLifeLevel.bind(this));

  // this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'pre')
  //   .getCharacteristic(Hap.Characteristic.FilterChangeIndication)
  //   .on('get', this.getPreFilterChangeIndication.bind(this));

  // this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'pre')
  //   .getCharacteristic(Hap.Characteristic.FilterLifeLevel)
  //   .on('get', this.getPreFilterLifeLevel.bind(this));
  // }

  // setupLightbulbServiceCharacteristics(): void {
  //   let lightbulbService = this.getOrCreateLightbulbService();

  //   lightbulbService.getCharacteristic(Hap.Characteristic.On)
  //     .on('get', this.getLightIndicator.bind(this))
  //     .on('set', this.setLightIndicator.bind(this));
  // }

  async getActiveState(callback): Promise<void> {
    let status = await this.client.getStatus(this.purifier.id);

    this.purifier.setStatus(status);

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

  getCurrentAirPurifierState(callback): void {
    if (this.purifier.power == PurifierResponse.Power.Off) {
      callback(null, Hap.Characteristic.CurrentAirPurifierState.INACTIVE);
      return;
    }

    if (this.purifier.state == PurifierResponse.State.Sleep || this.purifier.state == PurifierResponse.State.AutoSleep) {
      callback(null, Hap.Characteristic.CurrentAirPurifierState.IDLE);
      return;
    }

    callback(null, Hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
  }

  getTargetPurifierState(callback): void {
    if (this.purifier.state == PurifierResponse.State.Auto) {
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

  getRotationSpeed(callback) {
    let intervals = {1: 20, 2: 50, 3: 100};
    let fanSpeed = intervals[this.purifier.fan];

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

      // not working :(
      // this.purifierService.getCharacteristic(Hap.Characteristic.CurrentAirPurifierState)
      //                     .updateValue(Hap.Characteristic.CurrentAirPurifierState.MANUAL);

      this.purifier.fan = targetSpeed;

      callback(null);
    } catch(e) {
      Logger.error('Unable to set fan speed', e);
      callback(e);
    }
  }

  // getPreFilterChangeIndication(callback) {
  //   if (this.preFilterpurifier.lifeLevel <= 20) {
  //     callback(null, Hap.Characteristic.FilterChangeIndication.CHANGE_FILTER);
  //   } else {
  //     callback(null, Hap.Characteristic.FilterChangeIndication.FILTER_OK);
  //   }
  // }

  // getPreFilterLifeLevel(callback) {
  //   callback(null, this.preFilterStatus.lifeLevel);
  // }

  // getMainFilterChangeIndication(callback) {
  //   if (this.mainFilterStatus.lifeLevel <= 20) {
  //     callback(null, Hap.Characteristic.FilterChangeIndication.CHANGE_FILTER);
  //   } else {
  //     callback(null, Hap.Characteristic.FilterChangeIndication.FILTER_OK);
  //   }
  // }

  // getMainFilterLifeLevel(callback) {
  //   callback(null, this.mainFilterStatus.lifeLevel);
  // }

  // getAirQuality(callback): void {
  //   let result;
  //   switch (this.status.airQuality) {
  //     case PurifierResponse.AirQuality.Excellent:
  //       result = Hap.Characteristic.AirQuality.EXCELLENT;
  //       break;
  //     case PurifierResponse.AirQuality.Good:
  //       result = Hap.Characteristic.AirQuality.GOOD;
  //       break;
  //     case PurifierResponse.AirQuality.Fair:
  //       result = Hap.Characteristic.AirQuality.FAIR;
  //       break;
  //     case PurifierResponse.AirQuality.Inferior:
  //       result = Hap.Characteristic.AirQuality.INFERIOR;
  //       break;
  //   }

  //   callback(null, result);
  // }

  // getLightIndicator(callback): void {
  //   callback(null, this.status.light == PurifierResponse.Light.On);
  // }

  // setLightIndicator(targetState, callback): void {
  //   Logger.log(this.purifier.name, `Turning light ${(targetState ? 'on' : 'off')}`);

  //   this.client.setLight(this.purifier.id, targetState).then(() => {
  //     callback(null);
  //   }).catch((err) => {
  //     callback(err);
  //   });
  // }
}