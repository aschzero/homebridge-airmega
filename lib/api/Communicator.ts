import * as request from 'request-promise';
import * as store from 'store';

import { Message, MessageHeader } from '../definitions/api/Message';
import { AuthenticatePayload, OAuthPayload, Payload } from '../definitions/api/Payload';
import { PurifierMetadata, PurifierStatus } from '../definitions/Purifier';
import { Store } from '../definitions/Store';
import { Logger } from '../HALogger';
import { Config } from './Config';

export class Communicator {

  async getPurifiers(): Promise<PurifierMetadata[]> {
    let payload: Payload = this.buildPayload(Config.Codes.DEVICE_LIST, null);

    try {
      let response = await request(payload);
      let purifiers: PurifierMetadata[] = response.body.deviceInfos.map(device => {
        return {
          nickname: device.dvcNick,
          barcode: device.barcode
        } as PurifierMetadata;
      });

      return purifiers;
    } catch(e) {
      Logger.log(`Unable to retrieve purifiers: ${e}`);
    }
  }

  async getStatus(deviceId: string): Promise<PurifierStatus> {
    let payload: Payload = this.buildPayload(Config.Codes.STATUS, deviceId)
    let response = await request(payload);
    let statusResponse = response.body.controlStatus;

    let status: PurifierStatus = {
      on: (statusResponse['0001'] == '1'),
      lightOn: (statusResponse['0007'] == '2'),
      fanSpeed: statusResponse['0003'],
      auto: (statusResponse['0002'] == '1'),
    }

    Logger.debug('Status response', statusResponse)
    Logger.debug('Status object', status);

    return status;
  }

  buildPayload(code: string, deviceId: string, options?: any): Payload {
    let message: Message = this.buildMessage(code, deviceId);
    let encodedMessage = `message=${encodeURIComponent(JSON.stringify(message))}`;

    let defaultOptions = {
      uri: `${Config.BASE_URI}/${code}.json`,
      headers: {
        'Content-Type': Config.ContentType.FORM,
        'User-Agent': Config.USER_AGENT
      },
      method: 'POST',
      json: true,
      form: encodedMessage
    }

    return {...defaultOptions, ...options} as Payload;
  }

  buildMessage(code: string, deviceId: string): Message {
    let tokens: Store = store.get('tokens');

    let header: MessageHeader = {
      trcode: code,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }

    let formData: Message = {
      header: header,
      body: {
        barcode: deviceId
      }
    }

    return formData;
  }

  buildOauthPayload(): OAuthPayload {
    let options: OAuthPayload = {
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

  buildAuthenticatePayload(username: string, password: string, state: string): AuthenticatePayload {
    let options: AuthenticatePayload = {
      uri: Config.Auth.SIGNIN_URL,
      headers: {
        'Content-Type': Config.ContentType.JSON,
        'User-Agent': Config.USER_AGENT
      },
      method: 'POST',
      json: true,
      resolveWithFullResponse: true,
      body: {
        'username': username,
        'password': password,
        'state': state,
        'auto_login': 'Y'
      }
    }

    return options;
  }
}