class HALogger {
  public log: any;

  setLogger(log: any) {
    this.log = log;
  }
}

export const Logger = new HALogger();