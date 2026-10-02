import { injectable } from "inversify";
import * as winston from "winston";
import { AppUtils } from "./app-utils";

@injectable()
export class Logger {
  constructor() {}
  private logger: winston.Logger = winston.createLogger({
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  });

  public info(msg: string): void {
    this.logger.info(msg);
  }

  public error(message: string, err?: Error): void {
    const fullError = err ? `\n${AppUtils.getFullException(err)}` : "";
    this.logger.error(`${message}${fullError}`);
  }
}
