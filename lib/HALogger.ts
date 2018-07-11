import { HAP } from './types';

class HALogger {
  public  log: HAP.Log;
  private debugMode: boolean;

  setLogger(log: HAP.Log, debugMode: boolean): void {
    this.log = log;
    this.debugMode = debugMode;
  }

  debug(message: string, data?: any): void {
    if (!this.debugMode) return;

    let result = message;
    if (data) {
      result += `: ${JSON.stringify(data)}`
    }

    this.log(result);
  }
}

export const Logger = new HALogger();