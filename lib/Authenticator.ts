import * as request from 'request-promise';
import * as store from 'store';

import { Config } from './Config';
import { Logger } from './HALogger';
import { TokenStore } from './TokenStore';
import { Request } from './types';
import { AesUtil, CryptoJS } from './util/aes';

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

    this.storeTokensFromCookie(response.headers['set-cookie']);
  }

  async getStateId(): Promise<string> {
    let payload = this.buildOauthPayload();

    let response = await request(payload);
    let query = response.request.uri.query;

    return query.split('state=').slice(-1)[0];
  }

  private storeTokensFromCookie(cookies: string[]): void {
    let tokenStore = new TokenStore();
    let accessToken = this.findToken(cookies, Config.Auth.COWAY_ACCESS_TOKEN);
    let refreshToken = this.findToken(cookies, Config.Auth.COWAY_REFRESH_TOKEN);

    let tokens = {
      accessToken: accessToken,
      refreshToken: refreshToken
    }

    tokenStore.setTokens(tokens);
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

    let iv = CryptoJS.lib.WordArray.random(16);
    let key = CryptoJS.lib.WordArray.random(16);
    let password = AesUtil.encrypt(iv, credentials.password, key);

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
        'password': password.toString(),
        'state': state,
        'auto_login': 'Y'
      }
    }

    return options;
  }
}