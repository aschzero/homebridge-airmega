class cLogger {
  public log: any;

  setLog(log: any) {
    this.log = log;
  }
}

export const Logger = new cLogger();