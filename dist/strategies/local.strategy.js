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
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const local_user_schema_js_1 = require("../database/schemas/local_user.schema.js");
const bcrypt_util_js_1 = require("../public/utils/bcrypt.util.js");
passport_1.default.serializeUser((user, done) => {
    console.log("serializing user...");
    console.log(user);
    done(null, user.id);
});
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("deserializing user");
    console.log(id);
    try {
        const user = yield local_user_schema_js_1.localUserModel.findById(id);
        if (!user)
            throw new Error("User not found");
        done(null, user);
    }
    catch (err) {
        console.log(err);
        done(err, null);
    }
}));
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: "email_or_username",
    passwordField: "login_password",
}, (email_or_username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const localUser = yield local_user_schema_js_1.localUserModel.findOne({
            $or: [{ email: email_or_username }, { username: email_or_username }],
        });
        if (!localUser)
            throw new Error("No user found");
        const isValid = bcrypt_util_js_1.Bcrypt.comparePasswords(password, localUser === null || localUser === void 0 ? void 0 : localUser.password);
        if (!isValid)
            throw new Error("Wrong password");
        done(false, localUser);
    }
    catch (err) {
        console.log(err);
        done(err, false);
    }
})));
//# sourceMappingURL=local.strategy.js.map