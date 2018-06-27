import * as request from 'request-promise';
import * as store from 'store';

import { Message, MessageHeader } from '../definitions/api/Message';
import { AuthenticatorPayload, FormPayload } from '../definitions/api/Payload';
import { PurifierMetadata } from '../definitions/Purifier';
import { Store } from '../definitions/Store';
import { Logger } from '../HALogger';
import { Config } from './Config';

export class Communicator {

  async getPurifiers(): Promise<PurifierMetadata[]> {
    let payload: FormPayload = this.buildPayload(Config.Codes.DEVICE_LIST)

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

  buildAuthenticatorPayload(username: string, password: string): AuthenticatorPayload {
    let options: AuthenticatorPayload = {
      uri: Config.Auth.URI,
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
        'state': Config.Auth.STATE,
        'auto_login': Config.Auth.AUTO_LOGIN
      }
    }

    return options;
  }

  buildPayload(code: string, options?: any): FormPayload {
    let message: Message = this.buildMessage(code);
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

    return {...defaultOptions, ...options} as FormPayload;
  }

  buildMessage(code: string): Message {
    let tokens: Store = store.get('tokens');

    let header: MessageHeader = {
      trcode: code,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }

    let formData: Message = {
      header: header,
      body: {}
    }

    return formData;
  }
}