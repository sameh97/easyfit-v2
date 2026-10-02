import { inject, injectable } from "inversify";
import { UserService } from "../services/user-service";
import { User } from "../models/user";
import { DtoMapper } from "../common/dto-mapper";
import { Logger } from "./../common/logger";
import { AppUtils } from "../common/app-utils";
import { UserDto } from "../models/dto/user-dto";
const { logInSchema } = require("./../common/validation");
import * as jwt from "jsonwebtoken";

@injectable()
export class UserController {
  constructor(
    @inject(UserService) private userService: UserService,
    @inject(DtoMapper) private dtoMapper: DtoMapper,
    @inject(Logger) private logger: Logger
  ) {}

  public login = async (req: any, res: any, next: any) => {
    let userFromBody: User = null;
    try {
      // get user from body
      userFromBody = req.body;

      const token: string = await this.userService.login(
        userFromBody.email,
        userFromBody.password
      );
      // set the token as a header
      res.setHeader("Authorization", token);
      res.send({});
    } catch (e) {
      const email = AppUtils.hasValue(userFromBody) ? userFromBody.email : "";
      this.logger.error(`Cannot login user: ${email}`, e);
      next(e);
    }
  };

  public createUser = async (req: any, res: any, next: any) => {
    let userToCreate: User = null;
    try {
      // map the user as entity
      userToCreate = this.dtoMapper.asEntity(req.body);

      const createdUser: User = await this.userService.create(userToCreate);

      res.status(201);
      next(this.dtoMapper.asDto(createdUser));
    } catch (err) {
      this.logger.error(
        `Cannot create user: ${JSON.stringify(userToCreate)}`,
        err
      );
      next(err);
    }
  };

  public getByEmail = async (req: any, res: any, next: any) => {
    try {
      const user: User = await this.userService.getByEmail(req.query.email);

      const userDto: UserDto = this.dtoMapper.asDto(user);

      next(userDto);
    } catch (error) {
      this.logger.error(`cannot get user`, error);
      next(error);
    }
  };

  public getAll = async (req: any, res: any, next: any) => {
    try {
      // retreve all users from database
      const users: User[] = await this.userService.getAll();

      // map all the users as dto to send to client
      const usersDto: UserDto[] = users.map((user) =>
        this.dtoMapper.asDto(user)
      );

      next(usersDto);
    } catch (err) {
      this.logger.error(`cannot get all users`, err);
      next(err);
    }
  };

  public update = async (req: any, res: any, next: any) => {
    let userToUpdate: User = null;
    try {
      // get user from body
      userToUpdate = this.dtoMapper.asEntity(req.body);

      // update user
      const updatedUser: User = await this.userService.update(userToUpdate);

      const token = jwt.sign(
        {
          sub: updatedUser,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: `${UserService.TOKEN_EXPIRATION_HOURS}h` }
      );

      res.setHeader("Authorization", token);
      res.status(201);

      next(this.dtoMapper.asDto(updatedUser));
    } catch (err) {
      this.logger.error(`Cannot update user ${JSON.stringify(req.body)}`, err);
      next(err);
    }
  };

  public delete = async (req: any, res: any, next: any) => {
    let userId: number;
    try {
      // get the id from query params
      userId = Number(req.query.id);

      // delete
      await this.userService.delete(userId);

      next(`user with id ${userId} has been deleted succesfuly`);
    } catch (err) {
      this.logger.error(`Cannot delete user: ${userId}`, err);
      next(err);
    }
  };
}
