import { Product } from "../product";

export class TempUrlDto {
  public uuid: string;
  public durationDays: number;
  public isActive: boolean;
  public gymId: number;
  public products: Product[];
}
