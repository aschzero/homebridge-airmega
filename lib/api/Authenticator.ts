import * as request from 'request-promise';
import * as store from 'store';

import { AuthenticatorPayload } from '../definitions/api/Payload';
import { Logger } from '../HALogger';
import { Communicator } from './Communicator';
import { Config } from './Config';

export class Authenticator {
  communicator: Communicator;

  constructor() {
    this.communicator = new Communicator();
  }

  async authenticate(username: string, password: string): Promise<Response> {
    let payload: AuthenticatorPayload = this.communicator.buildAuthenticatorPayload(username, password);

    try {
      let response = await request(payload);
      let cookies = response.headers['set-cookie'];

      let accessToken = this.findToken(cookies, Config.Auth.COWAY_ACCESS_TOKEN);
      let refreshToken = this.findToken(cookies, Config.Auth.COWAY_REFRESH_TOKEN);

      store.set('tokens', {'accessToken': accessToken, 'refreshToken': refreshToken});

      return response;
    } catch(e) {
      Logger.log(`Unable to authenticate: ${e}`);
    }
  }

  findToken(cookies: Array<string>, key: string): string {
    try {
      let tokenCookie = cookies.find(cookie => {
        return cookie.split('=')[0] == key
      });

      let token = tokenCookie.split('=')[1].split(';')[0]

      return token;
    } catch(e) {
      Logger.log(`Unable to retrieve ${key}: ${e}`);
    }
  }
}