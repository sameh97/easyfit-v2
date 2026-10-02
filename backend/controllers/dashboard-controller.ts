import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { Logger } from "../common/logger";
import { InputError } from "../exeptions/input-error";
import { DashboardSummaryDto } from "../models/dto/dashboard-summary-dto";
import { DashboardService } from "../services/dashboard-service";

/** `verifyToken` puts the decoded JWT on `req.user`; its `sub` is the signed-in user. */
interface AuthenticatedRequest extends Request {
  user?: { sub?: { gymId?: number } };
}

/** Max |offset| of a real timezone (UTC−12 … UTC+14), in minutes. */
const MAX_TZ_OFFSET_MINUTES = 14 * 60;

@injectable()
export class DashboardController {
  constructor(
    @inject(DashboardService) private dashboardService: DashboardService,
    @inject(Logger) private logger: Logger
  ) {}

  public getSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Scope by the gym in the verified JWT, never by a client-supplied gymId.
      const gymId: number = Number(req.user?.sub?.gymId);
      if (!Number.isInteger(gymId)) {
        throw new InputError("Cannot resolve the gym of the signed-in user");
      }

      const rawOffset = req.query.tzOffset;
      const tzOffset: number = rawOffset === undefined ? 0 : Number(rawOffset);
      if (!Number.isInteger(tzOffset) || Math.abs(tzOffset) > MAX_TZ_OFFSET_MINUTES) {
        throw new InputError("tzOffset must be a whole number of minutes between -840 and 840");
      }

      const summary: DashboardSummaryDto = await this.dashboardService.getSummary(gymId, tzOffset);

      next(summary);
    } catch (err) {
      this.logger.error(`cannot get dashboard summary`, err);
      next(err);
    }
  };
}
