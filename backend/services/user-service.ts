import { inject, injectable } from "inversify";
import { AuthenticationError } from "../exeptions/authentication-error";
import { User } from "../models/user";
import { UsersRepository } from "../repositories/users-repository";
import * as jwt from "jsonwebtoken";
import { PasswordManagerService } from "./password-manager-service";
import { Transaction } from "sequelize/types";
import { AppDBConnection } from "../config/database";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";

@injectable()
export class UserService {
  public static readonly TOKEN_EXPIRATION_HOURS = 240;
  constructor(
    @inject(UsersRepository) private usersRepository: UsersRepository,
    @inject(PasswordManagerService)
    private passwordManager: PasswordManagerService,
    @inject(AppDBConnection) private appDBconnection: AppDBConnection,
    @inject(Logger) private logger: Logger
  ) {}

  public async login(email: string, password: string): Promise<string> {
    // get user from database by email
    const userInDB = await this.usersRepository.getByEmail(email);

    // check if the givin password is right
    const isPasswordOk = await this.passwordManager.isEqual(
      password,
      userInDB.password
    );
    if (!isPasswordOk) {
      throw new AuthenticationError(`User with ${email} not authenticated`);
    }

    // if the password is ok, make a new token
    const token = jwt.sign(
      {
        sub: userInDB,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: `${UserService.TOKEN_EXPIRATION_HOURS}h` }
    );

    return token;
  }

  public async create(user: User): Promise<User> {
    let transaction: Transaction = null;
    try {
      // hash the password
      const hashedPassword = await this.passwordManager.hashAndSalt(
        user.password
      );

      user.password = hashedPassword;

      transaction = await this.appDBconnection.createTransaction();

      // create new user
      const createdUser = await this.usersRepository.save(user, transaction);

      await transaction.commit();

      return createdUser;
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      console.log(
        `Error while creating user , error: ${AppUtils.getFullException(err)}`
      );
      throw err;
    }
  }

  public getByEmail = async (email: string): Promise<User> => {
    try {
      const userInDB = await this.usersRepository.getByEmail(email);

      this.logger.info(`Returning user with email ${userInDB.email}`);

      return userInDB;
    } catch (error) {
      this.logger.error(
        `cannot get user, error ${AppUtils.getFullException(error)}`,
        error
      );
      throw error;
    }
  };

  public getAll = async (): Promise<User[]> => {
    // get all users
    const users = await this.usersRepository.getAll();
    this.logger.info(`Returning ${users.length} users`);
    return users;
  };

  public update = async (user: User): Promise<User> => {
    let transaction: Transaction = null;
    try {
      // hash the password
      if (AppUtils.hasValue(user.password) && user.password !== "") {
        const hashedPassword = await this.passwordManager.hashAndSalt(
          user.password
        );

        user.password = hashedPassword;
      }

      transaction = await this.appDBconnection.createTransaction();

      const updatedUser = await this.usersRepository.update(user, transaction);

      await transaction.commit();

      this.logger.info(`updated user with id ${updatedUser.id}`);

      return updatedUser;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }

      this.logger.error(
        `cannot update user, error ${AppUtils.getFullException(error)}`,
        error
      );
      throw error;
    }
  };

  public delete = async (id: number): Promise<void> => {
    let transaction: Transaction = null;
    try {
      this.logger.info(`Deleting user with id: ${id}`);

      transaction = await this.appDBconnection.createTransaction();

      await this.usersRepository.delete(id, transaction);

      transaction.commit();

      this.logger.info(`User with id ${id} has been deleted`);
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while deleting user: error: ${AppUtils.getFullException(
          error
        )}`,
        error
      );
      throw error;
    }
  };
}
