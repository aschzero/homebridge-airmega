"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Request = require("request-promise");
const Logger_1 = require("./Logger");
const APIConfig_1 = require("./APIConfig");
class APIAuthenticator {
    authenticate(email, password, log) {
        let options = {
            uri: `${APIConfig_1.APIConfig.baseUri}/${APIConfig_1.APIConfig.loginEndpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': APIConfig_1.APIConfig.userAgent
            },
            method: 'POST',
            json: true,
            body: {
                'email': email,
                'password': password
            }
        };
        Logger_1.Logger.log('Authenticating with Airmega');
        return new Promise((resolve, reject) => {
            Request(options).then((response) => {
                if (!response.body) {
                    throw Error('Expected body in response');
                }
                let result = response.body;
                if (!result.userToken) {
                    throw Error(`Authentication response does not contain a user token: ${result}`);
                }
                this.token = result.userToken;
                Logger_1.Logger.log('Successfully logged in');
                resolve(result.purifiers);
            }).catch((err) => {
                Logger_1.Logger.log(`Encountered an error when trying to get user token: ${err}`);
                reject(err);
            });
        });
    }
}
exports.Authenticator = new APIAuthenticator();
//# sourceMappingURL=APIAuthenticator.js.map