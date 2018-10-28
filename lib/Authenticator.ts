import * as request from 'request-promise';

import { Config } from './Config';
import { Logger } from './HALogger';
import { TokenStore } from './TokenStore';
import { Request, Tokens } from './types';
import { AesUtil, CryptoJS } from './util/aes';

export class Authenticator {

  async login(username: string, password: string): Promise<void> {
    let stateId = await this.getStateId();
    let cookies = await this.authenticate(stateId, username, password);
    let authCode = await this.getAuthCode(cookies);
    let tokens = await this.getAuthTokens(authCode);

    new TokenStore().setTokens(tokens);
  }

  private async getStateId(): Promise<string> {
    let payload = this.buildOauthPayload();
    let response = await request.get(payload);
    let query = response.request.uri.query;

    return query.match(/(?<=state\=)(.*?)(?=\&)/)[0];
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

  private async getAuthTokens(authCode: string): Promise<Tokens> {
    let message = {
      "header": {
        "result": false,
        "error_code": "",
        "error_text": "",
        "info_text": "",
        "message_version": "",
        "login_session_id": "",
        "trcode": "CWIL0100",
        "accessToken": "",
        "refreshToken": ""
      },
      "body": {
        "authCode": authCode,
        "isMobile": "M",
        "langCd": "en",
        "osType": 1,
        "redirectUrl": Config.Auth.REDIRECT_URL,
        "serviceCode": "com.coway.IOCareKor"
      }
    }

    // use communicatr::buildPayload here?
    let payload = {
      uri: `${Config.BASE_URI}/${Config.Endpoints.DEVICE_LIST}`,
      headers: {
        ContentType: 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      json: true,
      form:`message=${encodeURIComponent(JSON.stringify(message))}`
    }

    try {
      let response = await request.post(payload);
      let tokens = {
        accessToken: response.header.accessToken,
        refreshToken: response.header.refreshToken,
      }

      return tokens;
    } catch(e) {
      Logger.log(`Unable to retrieve auth tokens: ${e}`);
    }
  }

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