var Accessory, Service, Characteristic, UUIDGen;

module.exports = (homebridge) => {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  AirmegaAccessory = require('./lib/AirmegaAccessory')(Accessory, Service, Characteristic);
  AirmegaPlatform = require('./lib/AirmegaPlatform')(UUIDGen, Accessory, AirmegaAccessory);

  homebridge.registerPlatform('homebridge-airmega', 'Airmega', AirmegaPlatform, true);
};
