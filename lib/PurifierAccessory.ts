import { Config } from './Config';
import { Logger } from './HALogger';
import { Hap } from './HAP';
import { PurifierClient } from './PurifierClient';
import { HAP, Purifier } from './types';

export class PurifierAccessory {
  client: PurifierClient;
  metadata: Purifier.Metadata;
  accessory: HAP.Accessory;
  purifierService: HAP.Service;
  status: Purifier.Status;
  preFilterStatus: Purifier.FilterStatus;
  mainFilterStatus: Purifier.FilterStatus;

  constructor(accessory: HAP.Accessory, metadata: Purifier.Metadata) {
    this.metadata = metadata;
    this.accessory = accessory;
    this.client = new PurifierClient(this.metadata.barcode);

    this.status = {
      power: Purifier.Power.Off,
      light: Purifier.Light.Off,
      fan: Purifier.Fan.Low,
      state: Purifier.State.Sleep,
      airQuality: Purifier.AirQuality.Excellent
    }

    this.preFilterStatus = {
      name: Config.Filters.PRE_FILTER,
      lifeLevel: 100
    }

    this.mainFilterStatus = {
      name: Config.Filters.MAIN_FILTER,
      lifeLevel: 100
    }

    this.setupAccessoryInformationServiceCharacteristics();
    this.setupPurifierServiceCharacteristics();
    this.setupAirQualityServiceCharacteristics();
    this.setupFilterMaintenanceServiceCharacteristics();
    this.setupLightbulbServiceCharacteristics();

    this.updateStatus();
    this.accessory.updateReachability(true);
  }

  async updateStatus() {
    try {
      this.status = await this.client.getStatus();

      let filterStatus = await this.client.getFilterStatus();
      this.preFilterStatus = filterStatus.find(filter => {
        return filter.name == Config.Filters.PRE_FILTER;
      });
      this.mainFilterStatus = filterStatus.find(filter => {
        return filter.name == Config.Filters.MAIN_FILTER;
      });
    } catch(e) {
      Logger.log(`Unable to update purifier status: ${e}`);
    }
  }

  getOrCreatePurifierService(): HAP.Service {
    let purifierService = this.accessory.getService(Hap.Service.AirPurifier);

    if (!purifierService) {
      purifierService = this.accessory.addService(Hap.Service.AirPurifier, this.metadata.nickname);
    }

    return purifierService;
  }

  getOrCreateAirQualityService(): HAP.Service {
    let airQualityService = this.accessory.getService(Hap.Service.AirQualitySensor);

    if (!airQualityService) {
      airQualityService = this.accessory.addService(Hap.Service.AirQualitySensor, this.metadata.nickname);
    }

    return airQualityService;
  }

  getOrCreatePreFilterService(): HAP.Service {
    let filterService = this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'pre');

    if (!filterService) {
      filterService = this.accessory.addService(Hap.Service.FilterMaintenance, 'Pre Filter', 'pre');
    }

    return filterService;
  }

  getOrCreateMainFilterService(): HAP.Service {
    let filterService = this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'main');

    if (!filterService) {
      filterService = this.accessory.addService(Hap.Service.FilterMaintenance, 'Max 2 Filter', 'main');
    }

    return filterService;
  }

  getOrCreateLightbulbService(): HAP.Service {
    let lightbulbService = this.accessory.getService(Hap.Service.Lightbulb);

    if (!lightbulbService) {
      lightbulbService = this.accessory.addService(Hap.Service.Lightbulb, this.metadata.nickname);
    }

    return lightbulbService;
  }

  setupAccessoryInformationServiceCharacteristics(): void {
    this.accessory.getService(Hap.Service.AccessoryInformation)
      .setCharacteristic(Hap.Characteristic.Manufacturer, 'Coway')
      .setCharacteristic(Hap.Characteristic.Model, 'Airmega')
      .setCharacteristic(Hap.Characteristic.SerialNumber, this.metadata.barcode);
  }

  setupPurifierServiceCharacteristics(): void {
    this.purifierService = this.getOrCreatePurifierService();

    this.purifierService.getCharacteristic(Hap.Characteristic.Active)
      .on('get', this.getActive.bind(this))
      .on('set', this.setActiveCharacteristic.bind(this));

    this.purifierService.getCharacteristic(Hap.Characteristic.CurrentAirPurifierState)
      .on('get', this.getCurrentAirPurifierState.bind(this));

    this.purifierService.getCharacteristic(Hap.Characteristic.TargetAirPurifierState)
      .on('get', this.getTargetPurifierState.bind(this))
      .on('set', this.setTargetPurifierState.bind(this));

    this.purifierService.getCharacteristic(Hap.Characteristic.RotationSpeed)
      .on('get', this.getRotationSpeed.bind(this))
      .on('set', this.setRotationSpeed.bind(this));
  }

  setupAirQualityServiceCharacteristics(): void {
    let airQualityService = this.getOrCreateAirQualityService();

    airQualityService.getCharacteristic(Hap.Characteristic.AirQuality)
      .on('get', this.getAirQuality.bind(this));
  }

  setupFilterMaintenanceServiceCharacteristics(): void {
    this.getOrCreateMainFilterService();
    this.getOrCreatePreFilterService();

  this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'main')
    .getCharacteristic(Hap.Characteristic.FilterChangeIndication)
    .on('get', this.getMainFilterChangeIndication.bind(this));

  this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'main')
    .getCharacteristic(Hap.Characteristic.FilterLifeLevel)
    .on('get', this.getMainFilterLifeLevel.bind(this));

  this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'pre')
    .getCharacteristic(Hap.Characteristic.FilterChangeIndication)
    .on('get', this.getPreFilterChangeIndication.bind(this));

  this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'pre')
    .getCharacteristic(Hap.Characteristic.FilterLifeLevel)
    .on('get', this.getPreFilterLifeLevel.bind(this));
  }

  setupLightbulbServiceCharacteristics(): void {
    let lightbulbService = this.getOrCreateLightbulbService();

    lightbulbService.getCharacteristic(Hap.Characteristic.On)
      .on('get', this.getLightIndicator.bind(this))
      .on('set', this.setLightIndicator.bind(this));
  }

  getActive(callback): void {
    if (this.status.power == Purifier.Power.On) {
      callback(null, Hap.Characteristic.Active.ACTIVE);
    } else {
      callback(null, Hap.Characteristic.Active.INACTIVE);
    }
  }

  setActiveCharacteristic(targetState, callback) {
    // Only toggle power when new state is different.
    // Prevents extraneous calls especially when changing
    // the fan speed (setRotationSpeed ensures device is on).
    if (Number(this.status.power) == targetState) {
      callback(null);
      return;
    }

    this.client.setPower(targetState).then(() => {
      Logger.log(this.metadata.nickname, `Turning ${targetState ? 'on' : 'off'}`);

      // Need to set the current purifier state characteristic here
      // otherwise accessory hangs on 'Turning on...'/'Turning off...'
      if (targetState) {
        this.purifierService.setCharacteristic(Hap.Characteristic.CurrentAirPurifierState, Hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
        this.status.power = Purifier.Power.On;
      } else {
        this.purifierService.setCharacteristic(Hap.Characteristic.CurrentAirPurifierState, Hap.Characteristic.CurrentAirPurifierState.INACTIVE);
        this.status.power = Purifier.Power.Off;
      }

      callback(null);
    }).catch((err) => {
      Logger.log(err);
      callback(err);
    });
  }

  getCurrentAirPurifierState(callback): void {
    this.updateStatus();

    if (this.status.power == Purifier.Power.Off) {
      callback(null, Hap.Characteristic.CurrentAirPurifierState.INACTIVE);
      return;
    }

    if (this.status.state == Purifier.State.Sleep || this.status.state == Purifier.State.AutoSleep) {
      callback(null, Hap.Characteristic.CurrentAirPurifierState.IDLE);
      return;
    }

    callback(null, Hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
  }

  getTargetPurifierState(callback): void {
    if (this.status.state == Purifier.State.Auto) {
      callback(null, Hap.Characteristic.TargetAirPurifierState.AUTO);
    } else {
      callback(null, Hap.Characteristic.TargetAirPurifierState.MANUAL);
    }
  }

  setTargetPurifierState(targetState, callback): void {
    if (targetState) {
      this.status.state = Purifier.State.Auto;
      Logger.log(this.metadata.nickname, 'Mode set to auto');
    } else {
      this.status.state = Purifier.State.Manual;
      Logger.log(this.metadata.nickname, 'Mode set to manual');
    }

    this.client.setMode(targetState).then(() => {
      callback(null);
    }).catch((err) => {
      callback(err);
    });
  }

  getRotationSpeed(callback) {
    let intervals = {1: 20, 2: 50, 3: 100};
    let fanSpeed = intervals[this.status.fan];

    callback(null, fanSpeed);
  }

  setRotationSpeed(targetState, callback) {
    let targetSpeed;
    let ranges = {};
    ranges[Purifier.Fan.Low] = [0, 40];
    ranges[Purifier.Fan.Medium] = [40, 70];
    ranges[Purifier.Fan.High] = [70, 100];

    for (var key in ranges) {
      var currentSpeed = ranges[key];

      if (targetState > currentSpeed[0] && targetState <= currentSpeed[1]) {
        targetSpeed = key;
        break;
      }
    }

    this.client.setFanSpeed(targetSpeed).then(() => {
      this.status.fan = targetSpeed;
      callback(null);
    }).catch((err) => {
      callback(err);
    });
  }

  getPreFilterChangeIndication(callback) {
    if (this.preFilterStatus.lifeLevel <= 20) {
      callback(null, Hap.Characteristic.FilterChangeIndication.CHANGE_FILTER);
    } else {
      callback(null, Hap.Characteristic.FilterChangeIndication.FILTER_OK);
    }
  }

  getPreFilterLifeLevel(callback) {
    callback(null, this.preFilterStatus.lifeLevel);
  }

  getMainFilterChangeIndication(callback) {
    if (this.mainFilterStatus.lifeLevel <= 20) {
      callback(null, Hap.Characteristic.FilterChangeIndication.CHANGE_FILTER);
    } else {
      callback(null, Hap.Characteristic.FilterChangeIndication.FILTER_OK);
    }
  }

  getMainFilterLifeLevel(callback) {
    callback(null, this.mainFilterStatus.lifeLevel);
  }

  getAirQuality(callback): void {
    let result;
    switch (this.status.airQuality) {
      case Purifier.AirQuality.Excellent:
        result = Hap.Characteristic.AirQuality.EXCELLENT;
        break;
      case Purifier.AirQuality.Good:
        result = Hap.Characteristic.AirQuality.GOOD;
        break;
      case Purifier.AirQuality.Fair:
        result = Hap.Characteristic.AirQuality.FAIR;
        break;
      case Purifier.AirQuality.Inferior:
        result = Hap.Characteristic.AirQuality.INFERIOR;
        break;
    }

    callback(null, result);
  }

  getLightIndicator(callback): void {
    callback(null, this.status.light == Purifier.Light.On);
  }

  setLightIndicator(targetState, callback): void {
    Logger.log(this.metadata.nickname, `Turning light ${(targetState ? 'on' : 'off')}`);

    this.client.setLight(targetState).then(() => {
      callback(null);
    }).catch((err) => {
      callback(err);
    });
  }
}