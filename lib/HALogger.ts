import { Log } from './definitions/HAP';

class HALogger {
  public  log: Log;
  private debugMode: boolean;

  setLogger(log: Log, debugMode: boolean): void {
    this.log = log;
    this.debugMode = debugMode;
  }

  debug(message: string): void {
    if (!this.debugMode) return;

    this.log(message);
  }
}

export const Logger = new HALogger();