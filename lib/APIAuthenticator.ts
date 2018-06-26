import * as Request from 'request-promise';

import { Log } from './interfaces/Log';
import { Logger } from './Logger';
import { APIConfig } from './APIConfig';
import { AuthenticationResult } from './interfaces/AuthenticationResult';
import { PurifierMetadataProperties } from './interfaces/Purifier';

class APIAuthenticator {
  token: string;

  authenticate(email: string, password: string, log: Log): Promise<PurifierMetadataProperties[]> {
    let options = {
      uri: `${APIConfig.baseUri}/${APIConfig.loginEndpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': APIConfig.userAgent
      },
      method: 'POST',
      json: true,
      body: {
        'email': email,
        'password': password
      }
    }

    Logger.log('Authenticating with Airmega');

    return new Promise((resolve, reject) => {
      Request(options).then((response) => {
        if (!response.body) {
          throw Error('Expected body in response');
        }

        let result = response.body as AuthenticationResult;

        if (!result.userToken) {
          throw Error(`Authentication response does not contain a user token: ${result}`);
        }

        this.token = result.userToken;
        Logger.log('Successfully logged in');
        resolve(result.purifiers);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}

export const Authenticator = new APIAuthenticator();