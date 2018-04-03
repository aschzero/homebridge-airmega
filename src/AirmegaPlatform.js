const Authenticator = require('./Authenticator');
var UUIDGen, Accessory, AirmegaAccessory;

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
      this.api.registerPlatformAccessories('homebridge-airmega', 'Airmega', [accessory]);
    }
  }
}

module.exports = (uuidGen, accessory, airmegaAccessory) => {
  UUIDGen = uuidGen;
  Accessory = accessory;
  AirmegaAccessory = airmegaAccessory;

  return AirmegaPlatform;
};