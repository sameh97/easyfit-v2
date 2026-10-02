export class UserDto {
  public id: number;
  public firstName: string;
  public lastName: string;
  public email: string;
  public password?: string;
  public roleId: number;
  public imageURL?: string;
  public phone: string;
  public birthDay: Date;
  public address: string;
  public gymId: number;
}
