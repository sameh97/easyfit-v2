export class Trainer {
  public id: number;
  public firstName: string;
  public lastName: string;
  public phone: string;
  /** ISO string from the API, YYYY-MM-DD when sent by a form. */
  public birthDay: Date | string;
  public email: string;
  public address: string;
  public isActive: boolean;
  public gender: number;
  /** ISO string from the API, YYYY-MM-DD when sent by a form. */
  public certificationDate: Date | string;
  /** ISO string from the API, YYYY-MM-DD when sent by a form. */
  public joinDate: Date | string;
  public imageURL: string;
  public gymId: number;
}
