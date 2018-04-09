class APIConfig {
  public static baseUri: string = 'https://iocao.coway.co.kr:4100/cowayusa.web/api';
  public static wsUri: string = 'ws://iocnoti.coway.co.kr:8082/noti/ws';
  public static userAgent: string = 'Coway/1.10 (iPhone; iOS 11.2.6; Scale/3.00)';

  public static loginEndpoint: string = 'CWU0110';
  public static triggerEndpoint: string = 'CWU0200';
  public static toggleAttributeEndpoint: string = 'CWU0300';
  public static airQualityEndpoint: string = 'CWU0240';
  public static filterEndpoint: string = 'CWU0280';
}

export { APIConfig }