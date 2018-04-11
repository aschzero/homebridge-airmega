"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("./Logger");
const APIAuthenticator_1 = require("./APIAuthenticator");
const HAP_1 = require("./HAP");
const PurifierAccessory_1 = require("./PurifierAccessory");
class AirmegaPlatform {
    constructor(log, config, platform) {
        Logger_1.Logger.setLog(log);
        this.platform = platform;
        this.accessories = [];
        this.registeredAccessories = new Map();
        if (this.platform) {
            this.platform.on('didFinishLaunching', () => {
                let email = config['email'];
                let password = config['password'];
                if (!email || !password) {
                    throw Error('email and password fields are required in config');
                }
                APIAuthenticator_1.Authenticator.authenticate(email, password, this.log).then((purifiers) => {
                    purifiers.forEach(purifier => this.addAccessory(purifier));
                });
            });
        }
    }
    configureAccessory(accessory) {
        accessory.updateReachability(false);
        this.registeredAccessories.set(accessory.UUID, accessory);
    }
    addAccessory(properties) {
        let uuid = HAP_1.Hap.UUIDGen.generate(properties.aliasName);
        let accessory;
        if (this.registeredAccessories.get(uuid)) {
            accessory = this.registeredAccessories.get(uuid);
        }
        else {
            accessory = new HAP_1.Hap.Accessory(properties.aliasName, uuid);
        }
        let purifierAccessory = new PurifierAccessory_1.PurifierAccessory(accessory, properties);
        accessory.on('identify', (paired, callback) => {
            callback();
        });
        this.accessories.push(accessory);
        if (!this.registeredAccessories.get(uuid)) {
            this.platform.registerPlatformAccessories('homebridge-airmega', 'Airmega', [accessory]);
        }
    }
}
exports.AirmegaPlatform = AirmegaPlatform;
//# sourceMappingURL=AirmegaPlatform.js.map