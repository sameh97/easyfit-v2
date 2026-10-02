import { inject, injectable } from "inversify";

import { Logger } from "./../common/logger";
import { FileUploadService } from "../services/file-upload-service";
import { ReadStream } from "fs";

@injectable()
export class UploadFileController {
  constructor(
    @inject(Logger) private logger: Logger,
    @inject(FileUploadService) private fileUploadService: FileUploadService
  ) {}

  public upload = async (req: any, res: any, next: any) => {
    try {
      const file = req.file;

      console.log(file);

      const uploadedFile = await this.fileUploadService.upload(file);

      console.log(uploadedFile);

      res.send(uploadedFile.Location);
    } catch (error) {
      this.logger.error(
        `Cannot upload file ${JSON.stringify(req.body)}`,
        error
      );
      next(error);
    }
  };

  public get = async (req: any, res: any, next: any) => {
    try {
      const key = req.params.key;
      const readStream = await this.fileUploadService.getFileStream(key);

      readStream.pipe(res);
    } catch (error) {
      this.logger.error(`Cannot get file with key: ${req.params.key}`, error);
      next(error);
    }
  };
}
