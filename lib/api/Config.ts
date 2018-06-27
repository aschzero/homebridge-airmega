export namespace Config {
  export const BASE_URI = 'https://iocareapp.coway.com/bizmob.iocare';
  export const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1';

  export namespace ContentType {
    export const FORM = 'application/x-www-form-urlencoded';
    export const JSON = 'application/json';
  }

  export namespace Auth {
    export const URI = 'https://idp.coway.com/user/signin/';
    export const STATE = '5632dfa4-dddf-45ef-a487-437f53f7a70d';
    export const AUTO_LOGIN = 'Y';
    export const COWAY_ACCESS_TOKEN = 'coway_access_token';
    export const COWAY_REFRESH_TOKEN = 'coway_refresh_token';
  }

  export namespace Codes {
    export const DEVICE_LIST = 'CWIL0100';
  }
}
