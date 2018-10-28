import * as request from 'request-promise';

import { Client } from './Client';
import { Config } from './Config';
import { Purifier } from './Purifier';
import { Request, TokenPair } from './types';
import { AesUtil, CryptoJS } from './util/aes';

export class Authenticator extends Client {
  result: any;

  async login(username: string, password: string): Promise<void> {
    let stateId = await this.getStateId();
    let cookies = await this.authenticate(stateId, username, password);
    let authCode = await this.getAuthCode(cookies);

    this.result = await this.getAccountStatus(authCode);

    this.tokenStore.saveTokens({
      accessToken: this.result.header.accessToken,
      refreshToken: this.result.header.refreshToken,
    });
  }

  listPurifiers(): Purifier[] {
    let purifiers = this.result.body.deviceInfos.map(device => {
      return new Purifier(device.barcode, device.dvcNick);
    });

    return purifiers;
  }

  async refreshTokens(oldTokens: TokenPair): Promise<TokenPair> {
    let message = this.buildAccountPayloadMessage();

    message.header.accessToken = oldTokens.accessToken;
    message.header.refreshToken = oldTokens.refreshToken;

    let payload = this.buildPayload(Config.Endpoints.DEVICE_LIST, message);
    let response = await request.post(payload);

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

  private async getAccountStatus(authCode: string): Promise<any> {
    let message = this.buildAccountPayloadMessage(authCode);

    let payload = this.buildPayload(Config.Endpoints.DEVICE_LIST, message);
    let response = await request.post(payload);

    return response;
  }

  // Similar OAuth payloads are used when retrieving the state ID as well
  // as the auth code, the latter of which requires cookies.
  private buildOauthPayload(cookies?: string): Request.OAuthPayload {
    let payload: Request.OAuthPayload = {
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

  private buildAccountPayloadMessage(authCode?: string) {
    let message = {
      header: {
        result: false,
        error_code: "",
        error_text: "",
        info_text: "",
        message_version: "",
        login_session_id: "",
        trcode: Config.Endpoints.DEVICE_LIST,
        accessToken: "",
        refreshToken: ""
      },
      body: {
        authCode: (authCode ? authCode : ""),
        isMobile: "M",
        langCd: "en",
        osType: 1,
        redirectUrl: Config.Auth.REDIRECT_URL,
        serviceCode: Config.Auth.SERVICE_CODE
      }
    }

    return message;
  }
}