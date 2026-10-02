import { Product } from './product';

export class Catalog {
  public uuid: string;
  public durationDays: number;
  public isActive: boolean;
  public gymId: number;
  public products: Product[] = [];
  public createdAt: Date;
}
