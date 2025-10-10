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
exports.loginRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const local_user_schema_1 = require("../database/schemas/local_user.schema");
const bcrypt_util_1 = require("../public/utils/bcrypt.util");
var router = (0, express_1.Router)();
// Login
router.post("/login", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const email_or_username = (0, sanitize_html_1.default)(req.body.email_or_username);
    const password = (0, sanitize_html_1.default)(req.body.login_password);
    if (email_or_username.length <= 0) {
        req.flash("warning_email", "Email field cannot be empty");
        return res.redirect(301, "/login");
    }
    if (password.length <= 0) {
        req.flash("warning_password", "Password field cannot be empty");
        return res.redirect(301, "/login");
    }
    const localUser = yield local_user_schema_1.localUserModel.findOne({
        $or: [{ email: email_or_username }, { username: email_or_username }],
    });
    if (localUser) {
        if (localUser.status === "deleted") {
            req.flash("error_input", "Couldn't find an account with this email or username!");
            return res.redirect(301, "/login");
        }
    }
    if (!localUser) {
        req.flash("error_input", "Couldn't find an account with this email or username!");
        return res.redirect(301, "/login");
    }
    const isValid = bcrypt_util_1.Bcrypt.comparePasswords(password, localUser === null || localUser === void 0 ? void 0 : localUser.password);
    if (!isValid) {
        req.flash("error_input", "Wrong username or password!");
        return res.redirect(301, "/login");
    }
    else {
        req.session.authenticated = true;
        passport_1.default.authenticate("local", {
            successRedirect: "/",
            failureRedirect: "/login",
            failureFlash: true,
        })(req, res, next);
    }
}));
exports.loginRouter = router;
//# sourceMappingURL=login.router.js.map