/** roleId of the EasyFit admin (gym users are 1). */
export const ADMIN_ROLE_ID: number = 2;

export class User {
  public id: string;
  public firstName: string;
  public lastName: string;
  public email: string;
  public password: string;
  public roleId: number;
  public phone: string;
  public imageURL?: string;
  public birthDay: Date;
  public createdAt: Date;
  public address: string;
  public gymId: number;
}

