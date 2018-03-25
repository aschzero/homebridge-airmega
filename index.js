var Accessory, Service, Characteristic, UUIDGen;

const http = require('http');
const Purifier = require('./src/purifier');
const Authenticator = require('./src/authenticator');
const constants = require('./src/constants');

class AirmegaPlatform {
  constructor(log, config, api) {
    this.name = config['name'];
    this.log = log;
    this.api = api;
    this.accessories = [];
    this.registeredAccessories = {};

    if (this.api) {
      this.api.on('didFinishLaunching', () => {
        var authenticator = new Authenticator({
          email: config['email'],
          password: config['password'],
          log: this.log
        });

        authenticator.authenticate().then((data) => {
          data.purifiers.forEach((purifier => {
            this.addAccessory(purifier.aliasName, purifier.productId, data.userToken);
          }))
        });
      });
    }
  }

  configureAccessory(accessory) {
    this.log(accessory.displayName, 'Purifier identified');

    accessory.reachable = false;

    this.registeredAccessories[accessory.UUID] = accessory;
  }

  addAccessory(accessoryName, deviceId, token) {
    var uuid = UUIDGen.generate(accessoryName);
    var accessory;

    if (this.registeredAccessories[uuid]) {
      this.log('getting cached accessory')
      accessory = this.registeredAccessories[uuid];
    } else {
      this.log('creating new accessory')
      accessory = new Accessory(accessoryName, uuid);
    }

    var airmegaAccessory = new AirmegaAccessory(this.log, {
      name: accessoryName,
      deviceId: deviceId,
      userToken: token
    }, accessory);

    accessory.on('identify', (paired, callback) => {
      this.log(accessory.displayName, 'Identified purifier');
      callback();
    });

    this.accessories.push(accessory);

    if (!this.registeredAccessories[uuid]) {
      this.addServices(accessory, accessoryName);
      this.api.registerPlatformAccessories('homebridge-airmega', 'Airmega', [accessory]);
    }
  }

  addServices(accessory, accessoryName) {
    accessory.addService(Service.AirPurifier, accessoryName);
    accessory.addService(Service.AirQualitySensor, accessoryName);
    accessory.addService(Service.Lightbulb, accessoryName);
    accessory.addService(Service.FilterMaintenance, 'Pre-Filter', 'pre');
    accessory.addService(Service.FilterMaintenance, 'Max2 Filter', 'max2');
  }
}

class AirmegaAccessory {
  constructor(log, config, accessory) {
    this.log = log;
    this.accessory = accessory;
    this.name = config.name;

    this.purifier = new Purifier({
      deviceId: config.deviceId,
      userToken: config.userToken,
      log: this.log
    });

    this.log(`Created new purifier with deviceId ${this.purifier.deviceId} and userToken ${this.purifier.userToken}`);

    this.setupServices();
    this.accessory.updateReachability(true);
    this.purifier.getLatestData();
  }

  setupServices() {
    this.accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, 'Coway')
      .setCharacteristic(Characteristic.Model, 'Airmega')
      .setCharacteristic(Characteristic.SerialNumber, '123-456-789');

    this.accessory.getService(Service.Lightbulb)
      .getCharacteristic(Characteristic.On)
      .on('get', this.getLight.bind(this))
      .on('set', this.setLight.bind(this));

    this.accessory.getService(Service.AirQualitySensor)
      .getCharacteristic(Characteristic.AirQuality)
      .on('get', this.getAirQuality.bind(this));

    this.accessory.getService(Service.AirPurifier)
      .getCharacteristic(Characteristic.Active)
      .on('get', this.getActiveCharacteristic.bind(this))
      .on('set', this.setActiveCharacteristic.bind(this));

    this.accessory.getService(Service.AirPurifier)
      .getCharacteristic(Characteristic.CurrentAirPurifierState)
      .on('get', this.getCurrentAirPurifierState.bind(this));

    this.accessory.getService(Service.AirPurifier)
      .getCharacteristic(Characteristic.TargetAirPurifierState)
        .on('get', this.getTargetAirPurifierState.bind(this))
        .on('set', this.setTargetAirPurifierState.bind(this));

    this.accessory.getService(Service.AirPurifier)
      .getCharacteristic(Characteristic.RotationSpeed)
        .on('get', this.getRotationSpeed.bind(this))
        .on('set', this.setRotationSpeed.bind(this));

    this.accessory.getServiceByUUIDAndSubType(Service.FilterMaintenance, 'pre')
      .getCharacteristic(Characteristic.FilterChangeIndication)
      .on('get', this.getPreFilterChangeIndication.bind(this));

    this.accessory.getServiceByUUIDAndSubType(Service.FilterMaintenance, 'pre')
      .getCharacteristic(Characteristic.FilterLifeLevel)
      .on('get', this.getPreFilterLifeLevel.bind(this));

    this.accessory.getServiceByUUIDAndSubType(Service.FilterMaintenance, 'max2')
      .getCharacteristic(Characteristic.FilterChangeIndication)
      .on('get', this.getMainFilterChangeIndication.bind(this));

    this.accessory.getServiceByUUIDAndSubType(Service.FilterMaintenance, 'max2')
      .getCharacteristic(Characteristic.FilterLifeLevel)
      .on('get', this.getMainFilterLifeLevel.bind(this));
  }

  getActiveCharacteristic(callback) {
    if (this.purifier == null) return;

    if (this.purifier.power) {
      this.log('Purifier is on');
      callback(null, Characteristic.Active.ACTIVE);
    } else {
      this.log('Purifier is off');
      callback(null, Characteristic.Active.INACTIVE);
    }
  }

  setActiveCharacteristic(targetState, callback) {
    if (this.purifier == null) return;

    // Only toggle power when new state is different.
    // Prevents extraneous calls especially when changing
    // the fan speed (setRotationSpeed ensures device is on).
    if (this.purifier.power == targetState) {
      callback(null);
      return;
    }

    this.purifier.setPower(targetState).then(() => {
      this.log(`Setting power to ${targetState}`);

      // Need to set the current purifier state characteristic here
      // otherwise accessory hangs on 'Turning on...'/'Turning off...'
      if (targetState) {
        this.purifierService.setCharacteristic(Characteristic.CurrentAirPurifierState, Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
      } else {
        this.purifierService.setCharacteristic(Characteristic.CurrentAirPurifierState, Characteristic.CurrentAirPurifierState.INACTIVE);
      }

      callback(null);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }

  getCurrentAirPurifierState(callback) {
    if (this.purifier == null) return;

    this.purifier.getLatestData();

    if (!this.purifier.power) {
      this.log('Current state is inactive');
      callback(null, Characteristic.CurrentAirPurifierState.INACTIVE);
      return;
    }

    if (this.purifier.fanSpeed == 0 || this.purifier.mode == 2 || this.purifier.mode == 6) {
      this.log('Current state is idle');
      callback(null, Characteristic.CurrentAirPurifierState.IDLE);
      return;
    }

    this.log('Current state is purifying');
    callback(null, Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
  }

  getTargetAirPurifierState(callback) {
    if (this.purifier == null) return;

    if (this.purifier.mode == 0) {
      this.log('Target purifier state is manual');
      callback(null, Characteristic.TargetAirPurifierState.MANUAL);
    } else {
      this.log('Target purifier state is auto');
      callback(null, Characteristic.TargetAirPurifierState.AUTO);
    }
  }

  setTargetAirPurifierState(targetState, callback) {
    if (this.purifier == null) return;

    let targetMode;
    if (targetState) {
      this.log('Setting mode to auto');
      targetMode = -1;
    } else {
      this.log('Setting mode to manual');
      targetMode = 1;
    }

    this.purifier.setFanSpeed(targetMode).then(() => {
      callback(null);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }

  getRotationSpeed(callback) {
    if (this.purifier == null) return;

    let intervals = {1: 20, 2: 50, 3: 100};
    let fanSpeed = intervals[this.purifier.fanSpeed];

    this.log(`Rotation speed is ${fanSpeed}`);
    callback(null, fanSpeed);
  }

  setRotationSpeed(targetState, callback) {
    if (this.purifier == null) return;

    let targetSpeed;
    let ranges = {1: [0, 40], 2: [40, 70], 3: [70, 100]};

    for (var key in ranges) {
      var currentSpeed = ranges[key];

      if (targetState > currentSpeed[0] && targetState <= currentSpeed[1]) {
        targetSpeed = key;
        break;
      }
    }

    this.log(`Setting rotation speed to ${targetSpeed}`);

    this.purifier.setFanSpeed(targetSpeed).then(() => {
      callback(null);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }

  getAirQuality(callback) {
    if (this.purifier == null) return;

    let result;
    switch (this.purifier.airQuality) {
      case 1:
        result = Characteristic.AirQuality.EXCELLENT;
        break;
      case 2:
        result = Characteristic.AirQuality.GOOD;
        break;
      case 3:
        result = Characteristic.AirQuality.FAIR;
        break;
      case 4:
        result = Characteristic.AirQuality.INFERIOR;
        break;
    }

    callback(null, result);
  }

  getLight(callback) {
    if (this.purifier == null) return;

    callback(null, this.purifier.getLightOn());
  }

  setLight(targetState, callback) {

    if (this.purifier == null) return;

    this.log(`Turning light ${(targetState ? 'on' : 'off')}`);

    this.purifier.setLightOn(targetState).then(() => {
      callback(null);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }

  getPreFilterChangeIndication(callback) {
    if (this.purifier == null) return;
      this.log(`preFilterAlarm ${this.purifier.mainFilterAlarm}`)

    if (this.purifier.preFilterAlarm) {
      callback(null, Characteristic.FilterChangeIndication.CHANGE_FILTER);
    } else {
      callback(null, Characteristic.FilterChangeIndication.FILTER_OK);
    }
  }

  getPreFilterLifeLevel(callback) {
    if (this.purifier == null) return;

    this.purifier.getFilterLifeLevels().then((data) => {
      this.log(`got pre filter life levels: ${JSON.stringify(data)}`)
      callback(null, data.prefilter);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }

  getMainFilterChangeIndication(callback) {
    if (this.purifier == null) return;

      this.log(`mainFilterAlarm ${this.purifier.mainFilterAlarm}`)

    if (this.purifier.mainFilterAlarm) {
      callback(null, Characteristic.FilterChangeIndication.CHANGE_FILTER);
    } else {
      callback(null, Characteristic.FilterChangeIndication.FILTER_OK);
    }
  }

  getMainFilterLifeLevel(callback) {
    if (this.purifier == null) return;

    this.purifier.getFilterLifeLevels().then((data) => {
      this.log(`got main filter life levels: ${JSON.stringify(data)}`)

      callback(null, data.hepafilter);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }
}

module.exports = (homebridge) => {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform('homebridge-airmega', 'Airmega', AirmegaPlatform, true);
  homebridge.registerAccessory('homebridge-airmega', 'Airmega', AirmegaAccessory);
};