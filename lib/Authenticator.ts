import * as request from 'request-promise';

import { Client } from './Client';
import { Config } from './Config';
import { OAuthPayload, Payload } from './interfaces/Request';
import { TokenPair } from './interfaces/TokenStore';
import { Logger } from './Logger';
import { Purifier } from './Purifier';
import { AesUtil, CryptoJS } from './util/aes';

export class Authenticator extends Client {

  async login(username: string, password: string): Promise<TokenPair> {
    let stateId = await this.getStateId();
    let cookies = await this.authenticate(stateId, username, password);
    let authCode = await this.getAuthCode(cookies);

    let tokens = await this.getTokensFromAuthCode(authCode);
    this.tokenStore.saveTokens(tokens);

    return tokens;
  }

  async getPurifiers(tokens: TokenPair): Promise<Purifier[]> {
    let payload = this.buildDeviceListPayload(tokens);
    Logger.debug('Sending payload', payload);

    let response = await request.post(payload);
    Logger.debug('Got response', response);

    return response.body.deviceInfos.map(device => new Purifier(device.barcode, device.dvcNick));
  }

  async refreshTokens(oldTokens: TokenPair): Promise<TokenPair> {
    let payload = this.buildTokenRefreshPayload(oldTokens);
    Logger.debug('Sending payload', payload);

    let response = await request.post(payload);
    Logger.debug('Sending payload', payload);

    let tokens = {
      accessToken: response.header.accessToken,
      refreshToken: response.header.refreshToken,
    }

    return tokens;
  }

  private async getStateId(): Promise<string> {
    let payload = this.buildOauthPayload();
    let response = await request.get(payload);
    let query = response.request.uri.query;

    return query.match(/(?<=state\=)(.*?)$/)[0];
  }

  private async authenticate(stateId: string, username: string, password: string): Promise<string> {
    let iv = CryptoJS.lib.WordArray.random(16);
    let key = CryptoJS.lib.WordArray.random(16);
    let encryptedPassword = AesUtil.encrypt(iv, password, key);

    let payload = {
      uri: Config.Auth.SIGNIN_URL,
      resolveWithFullResponse: true,
      json: true,
      headers: {
        'Content-Type': Config.ContentType.JSON,
        'User-Agent': Config.USER_AGENT
      },
      body: {
        'username': username,
        'password': encryptedPassword.toString(),
        'state': stateId,
        'auto_login': 'Y'
      }
    }

    let response = await request.post(payload);
    let cookies = response.headers['set-cookie'];

    return cookies;
  }

  private async getAuthCode(cookies: string): Promise<string> {
    let payload = this.buildOauthPayload(cookies);
    let response = await request.get(payload);
    let query = response.request.uri.query;

    return query.match(/(?<=code\=)(.*?)(?=\&)/)[0];
  }

  private async getTokensFromAuthCode(authCode: string): Promise<TokenPair> {
    let payload = this.buildFinishOauthPayload(authCode);
    Logger.debug('Sending payload', payload);

    let response = await request.post(payload);
    Logger.debug('Got response', response);

    let tokens = {
      accessToken: response.header.accessToken,
      refreshToken: response.header.refreshToken
    }

    return tokens;
  }

  // Similar OAuth payloads are used when retrieving the state ID as well
  // as the auth code, the latter of which requires cookies.
  private buildOauthPayload(cookies?: string): OAuthPayload {
    let payload: OAuthPayload = {
      uri: Config.Auth.OAUTH_URL,
      resolveWithFullResponse: true,
      headers: {
        'User-Agent': Config.USER_AGENT,
        Cookie: cookies
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

    return payload;
  }

  private buildFinishOauthPayload(authCode: string): Payload {
    let message = {
      header: {
        trcode: Config.Endpoints.TOKEN_REFRESH,
        accessToken: "",
        refreshToken: ""
      },
      body: {
        authCode: authCode,
        isMobile: "M",
        langCd: "en",
        osType: 1,
        redirectUrl: Config.Auth.REDIRECT_URL,
        serviceCode: Config.Auth.SERVICE_CODE
      }
    }

    let payload = this.buildPayload(Config.Endpoints.TOKEN_REFRESH, message);

    return payload;
  }

  private buildDeviceListPayload(tokens: TokenPair): Payload {
    let message = {
      header: {
        trcode: Config.Endpoints.DEVICE_LIST,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      },
      body: {
        pageIndex: "0",
        pageSize: "100"
      }
    }

    let payload = this.buildPayload(Config.Endpoints.DEVICE_LIST, message);

    return payload;
  }

  private buildTokenRefreshPayload(tokens: TokenPair): Payload {
    let message = {
      header: {
        trcode: Config.Endpoints.TOKEN_REFRESH,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      },
      body: {
        isMobile: "M",
        langCd: "en",
        osType: 1,
        redirectUrl: Config.Auth.REDIRECT_URL,
        serviceCode: Config.Auth.SERVICE_CODE
      }
    }

    let payload = this.buildPayload(Config.Endpoints.TOKEN_REFRESH, message);

    return payload;
  }
}