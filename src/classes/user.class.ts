import crypto from "crypto";
import { Bcrypt } from "../public/utils/bcrypt.util.js";
import { LocalUsersController } from "../controllers/local_users.controller.js";

export class User {
  readonly userID: string;
  public username!: string;
  protected avatar!: string;
  public rank!: number;
  public status!: string;

  constructor(public email: string, private password: any) {
    this.userID = crypto.randomUUID();
    this.email = email;
    this.setUserPassword = password;
    this.setUserUsername = `user${Date.now()}`;
    this.setUserRank = 1;
    this.setUserStatus = "online";
    this.setUserAvatar = "";
  }

  public get getLocalUserID() {
    return this.userID;
  }

  public set setUserUsername(username: string) {
    this.username = username;
  }

  public get getUserUsername() {
    return this.username;
  }

  public set setUserPassword(password: any) {
    var hash = Bcrypt.hashedPassword(password);
    this.password = hash;
  }

  public get getUserPassword() {
    return this.password;
  }

  public set setUserEmail(email: string) {
    this.email = email;
  }

  public get getUserEmail() {
    return this.email;
  }

  public set setUserRank(rank: number) {
    this.rank = rank;
  }

  public get getUserRank() {
    return this.rank;
  }

  public set setUserStatus(status: string) {
    this.status = status;
  }

  public get getUserStatus() {
    return this.status;
  }

  public set setUserAvatar(avatar: string) {
    this.avatar = avatar;
  }

  public get getUserAvatar() {
    return this.avatar;
  }

  public async setLocalUser() {
    try {
      return await LocalUsersController.createLocalUser(
        this.userID,
        this.username,
        this.email,
        this.password,
        this.avatar,
        this.rank,
        this.status
      );
    } catch (err) {
      return console.error(err);
    }
  }

  public async updateLocalUser(
    email: string,
    username?: string | undefined,
    avatar?: string | undefined
  ) {
    try {
      return await LocalUsersController.updateLocalUser(
        email,
        username,
        avatar
      );
    } catch (err) {
      return console.error(err);
    }
  }

  public async deleteLocalUser(userID: string) {
    try {
      return await LocalUsersController.deleteLocalUser(userID);
    } catch (err) {
      return console.error(err);
    }
  }
}
