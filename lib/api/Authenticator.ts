import * as request from 'request-promise';
import * as store from 'store';

import { Logger } from '../HALogger';
import { Communicator } from './Communicator';
import { Config } from './Config';

export class Authenticator {
  communicator: Communicator;

  constructor() {
    this.communicator = new Communicator();
  }
  async authenticate(username: string, password: string, state: string): Promise<void> {
    try {
      let payload = this.communicator.buildAuthenticatePayload(username, password, state);
      let response = await request(payload);

      this.storeTokens(response.headers['set-cookie']);
    } catch(e) {
      Logger.log(`Unable to authenticate: ${e}`);
    }
  }

  async getStateId(): Promise<string> {
    try {
      let payload = this.communicator.buildOauthPayload();

      let response = await request(payload);
      let query = response.request.uri.query;

      return query.split('state=').slice(-1)[0];
    } catch(e) {
      Logger.log(`Unable to get state: ${e}`);
    }
  }

  private storeTokens(cookies: string[]): void {
    let accessToken = this.findToken(cookies, Config.Auth.COWAY_ACCESS_TOKEN);
    let refreshToken = this.findToken(cookies, Config.Auth.COWAY_REFRESH_TOKEN);
    let storeData = {
      accessToken: accessToken,
      refreshToken: refreshToken
    }

    Logger.debug(`Storing tokens: ${JSON.stringify(storeData)}`);

    store.set('tokens', storeData);
  }

  private findToken(cookies: string[], key: string): string {
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