import * as request from 'request-promise';
import * as store from 'store';

import { Config } from './Config';
import { Logger } from './HALogger';
import { Request, TokenStore } from './types';
import { Communicator } from './Communicator';

export class Authenticator {

  async login(username: string, password: string): Promise<void> {
    store.set('credentials', {
      username: username,
      password: password
    });

    await this.authenticate();
  }

  async authenticate(): Promise<void> {
    let stateId = await this.getStateId();
    let payload = this.buildAuthenticatePayload(stateId);
    let response = await request(payload);

    this.storeTokens(response.headers['set-cookie']);
  }

  async getStateId(): Promise<string> {
    let payload = this.buildOauthPayload();

    let response = await request(payload);
    let query = response.request.uri.query;

    return query.split('state=').slice(-1)[0];
  }

  tokenExpired(): boolean {
    let tokens: TokenStore = store.get('tokens');
    let now = Date.now();

    return (now - tokens.storedAt) >= Config.Auth.TOKEN_EXP;
  }

  private storeTokens(cookies: string[]): void {
    let accessToken = this.findToken(cookies, Config.Auth.COWAY_ACCESS_TOKEN);
    let refreshToken = this.findToken(cookies, Config.Auth.COWAY_REFRESH_TOKEN);

    let storeData = {
      accessToken: accessToken,
      refreshToken: refreshToken,
      storedAt: Date.now()
    }

    Logger.debug('Storing tokens', storeData);

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

  private buildOauthPayload(): Request.OAuthPayload {
    let options: Request.OAuthPayload = {
      uri: Config.Auth.OAUTH_URL,
      method: 'GET',
      resolveWithFullResponse: true,
      headers: {
        'User-Agent': Config.USER_AGENT
      },
      qs: {
        auth_type: 0,
        response_type: 'code',
        client_id: Config.Auth.CLIENT_ID,
        scope: 'login',
        lang: 'en_US',
        redirect_url: Config.Auth.REDIRECT_URL
      }
    }

    return options;
  }

  private buildAuthenticatePayload(state: string): Request.AuthenticatePayload {
    let credentials = store.get('credentials');

    let options: Request.AuthenticatePayload = {
      uri: Config.Auth.SIGNIN_URL,
      headers: {
        'Content-Type': Config.ContentType.JSON,
        'User-Agent': Config.USER_AGENT
      },
      method: 'POST',
      json: true,
      resolveWithFullResponse: true,
      body: {
        'username': credentials.username,
        'password': credentials.password,
        'state': state,
        'auto_login': 'Y'
      }
    }

    return options;
  }
}