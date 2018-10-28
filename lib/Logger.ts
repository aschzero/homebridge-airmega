import { HAP } from './types'

class AirmegaLogger {
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

  error(message: string, error: any) {
    this.log(`[ERROR] ${message}. ${error}`)
  }
}

export const Logger = new AirmegaLogger();