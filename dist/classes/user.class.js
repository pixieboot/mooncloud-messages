"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_util_js_1 = require("../public/utils/bcrypt.util.js");
const local_users_controller_js_1 = require("../controllers/local_users.controller.js");
class User {
    constructor(email, password) {
        this.email = email;
        this.password = password;
        this.userID = crypto_1.default.randomUUID();
        this.email = email;
        this.setUserPassword = password;
        this.setUserUsername = `user${Date.now()}`;
        this.setUserRank = 1;
        this.setUserStatus = "online";
        this.setUserAvatar = "";
    }
    get getLocalUserID() {
        return this.userID;
    }
    set setUserUsername(username) {
        this.username = username;
    }
    get getUserUsername() {
        return this.username;
    }
    set setUserPassword(password) {
        var hash = bcrypt_util_js_1.Bcrypt.hashedPassword(password);
        this.password = hash;
    }
    get getUserPassword() {
        return this.password;
    }
    set setUserEmail(email) {
        this.email = email;
    }
    get getUserEmail() {
        return this.email;
    }
    set setUserRank(rank) {
        this.rank = rank;
    }
    get getUserRank() {
        return this.rank;
    }
    set setUserStatus(status) {
        this.status = status;
    }
    get getUserStatus() {
        return this.status;
    }
    set setUserAvatar(avatar) {
        this.avatar = avatar;
    }
    get getUserAvatar() {
        return this.avatar;
    }
    setLocalUser() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield local_users_controller_js_1.LocalUsersController.createLocalUser(this.userID, this.username, this.email, this.password, this.avatar, this.rank, this.status);
            }
            catch (err) {
                return console.error(err);
            }
        });
    }
    updateLocalUser(email, username, avatar) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield local_users_controller_js_1.LocalUsersController.updateLocalUser(email, username, avatar);
            }
            catch (err) {
                return console.error(err);
            }
        });
    }
    deleteLocalUser(userID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield local_users_controller_js_1.LocalUsersController.deleteLocalUser(userID);
            }
            catch (err) {
                return console.error(err);
            }
        });
    }
}
exports.User = User;
//# sourceMappingURL=user.class.js.map