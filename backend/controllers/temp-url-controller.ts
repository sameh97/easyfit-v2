import { inject, injectable } from "inversify";
import { TempUrlDtoMapper } from "../common/dto-mapper/temp-url-dto-mapper";
import { Logger } from "../common/logger";
import { NotFound } from "../exeptions/notFound-exeption";
import { OutOfDateError } from "../exeptions/out-of-date-error";
import { TempUrlDto } from "../models/dto/temp-url-dto";
import { Product } from "../models/product";
import { TempUrl } from "../models/temp-url";
import { TempUrlService } from "../services/temp-url-service";

@injectable()
export class TempUrlController {
  constructor(
    @inject(TempUrlService) private tempUrlService: TempUrlService,
    @inject(TempUrlDtoMapper) private tempUrlDtoMapper: TempUrlDtoMapper,
    @inject(Logger) private logger: Logger
  ) {}

  public getAll = async (req: any, res: any, next: any) => {
    try {
      const Urls: TempUrl[] = await this.tempUrlService.getAll(req.query.gymId);

      const tempUrlsDto: TempUrlDto[] = Urls.map((url) =>
        this.tempUrlDtoMapper.asDto(url)
      );

      next(tempUrlsDto);
    } catch (err) {
      this.logger.error(`cannot get all Temporary URLs`, err);
      next(err);
    }
  };

  public getByUUID = async (req: any, res: any, next: any) => {
    try {
      // get catalog by uuid 
      const catalogUrlProducts: Product[] = await this.tempUrlService.getByUUID(
        req.params.uuid
      );

      const htmlContent: string = await this.tempUrlService.buildCatalogHtml(
        catalogUrlProducts
      );

      res.type(".html");
      res.send(htmlContent);
    } catch (err) {
      if (err instanceof NotFound) {
        // if the catalog is not found, display not found html template
        const htmlContent: string =
          await this.tempUrlService.buildCatalogNotFoundHtml();
        res.type(".html");
        res.send(htmlContent);
      } else if (err instanceof OutOfDateError) {
          // if the catalog is out of date display out of date html template
        const htmlContent: string =
          await this.tempUrlService.buildCatalogOutOfDateHtml();
        res.type(".html");
        res.send(htmlContent);
      }
      this.logger.error(`cannot get Temporary URL`, err);
      next(err);
    }
  };

  public create = async (req: any, res: any, next: any) => {
    let tempUrlToCreate: TempUrl = null;
    try {
      tempUrlToCreate = this.tempUrlDtoMapper.asEntity(req.body);

      const createdTempUrl: TempUrl = await this.tempUrlService.create(
        tempUrlToCreate
      );

      res.status(201);

      next(this.tempUrlDtoMapper.asDto(createdTempUrl));
    } catch (err) {
      this.logger.error(
        `Cannot create Temporary URL ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public update = async (req: any, res: any, next: any) => {
    let tempUrlToUpdate: TempUrl = null;
    try {
      tempUrlToUpdate = this.tempUrlDtoMapper.asEntity(req.body);

      const updatedTempUrl: TempUrl = await this.tempUrlService.update(
        tempUrlToUpdate
      );

      res.status(200);

      next(this.tempUrlDtoMapper.asDto(updatedTempUrl));
    } catch (err) {
      this.logger.error(
        `Cannot update Temporary URL ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public delete = async (req: any, res: any, next: any) => {
    let uuid: string;
    try {
      uuid = req.query.uuid;
    // delete by uuid
      await this.tempUrlService.delete(uuid);

      next(`Temporary URL with uuid ${uuid} has been deleted succesfuly`);
    } catch (err) {
      this.logger.error(`Cannot delete Temporary URL: ${uuid}`, err);
      next(err);
    }
  };

  public sendWhatsApp = async (req: any, res: any, next: any) => {
    let whatsAppMessageContent: any = req.body;
    try {
      // send whatsApp message
      const sentMessage: any = await this.tempUrlService.sendWhatsApp(
        whatsAppMessageContent
      );

      next(sentMessage);
    } catch (error) {
      this.logger.error(
        `Cannot Send WhatsApp message: ${JSON.stringify(
          whatsAppMessageContent
        )} `,
        error
      );
      next(error);
    }
  };
}



