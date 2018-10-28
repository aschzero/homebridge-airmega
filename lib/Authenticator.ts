import * as request from 'request-promise';

import { Communicator } from './Communicator';
import { Config } from './Config';
import { Logger } from './HALogger';
import { Purifier, Request } from './types';
import { AesUtil, CryptoJS } from './util/aes';

export class Authenticator extends Communicator {
  stateIdRegex: RegExp;
  authCodeRegex: RegExp;
  result: any;

  constructor() {
    super();

    this.stateIdRegex = /(?<=state\=)(.*?)$/;
    this.authCodeRegex = /(?<=code\=)(.*?)(?=\&)/;
  }

  async login(username: string, password: string): Promise<void> {
    let stateId = await this.getStateId();
    let cookies = await this.authenticate(stateId, username, password);
    let authCode = await this.getAuthCode(cookies);

    this.result = await this.getFinalResult(authCode);

    this.tokenStore.setTokens({
      accessToken: this.result.header.accessToken,
      refreshToken: this.result.header.refreshToken,
    });
  }

  getPurifiers(): Purifier.Metadata[] {
    let purifiers = this.result.body.deviceInfos.map(device => {
      let metadata: Purifier.Metadata = {
        nickname: device.dvcNick,
        barcode: device.barcode
      }

      return metadata;
    });

    return purifiers;
  }

  private async getStateId(): Promise<string> {
    let payload = this.buildOauthPayload();
    let response = await request.get(payload);
    let query = response.request.uri.query;

    return query.match(this.stateIdRegex)[0];
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

    return query.match(this.authCodeRegex)[0];
  }

  private async getFinalResult(authCode: string): Promise<any> {
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
        authCode: authCode,
        isMobile: "M",
        langCd: "en",
        osType: 1,
        redirectUrl: Config.Auth.REDIRECT_URL,
        serviceCode: Config.Auth.SERVICE_CODE
      }
    }

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
}