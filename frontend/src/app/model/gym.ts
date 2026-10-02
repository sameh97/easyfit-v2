import { Member } from "./member";
import { User } from "./user";

export class Gym {
  public id: number;
  public name: string;
  public phone: string;
  public address: string;
  //TODO: check if we need to include user and members:
  public user: User;
  public members: Member[];
}
