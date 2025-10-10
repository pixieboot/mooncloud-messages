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
exports.localSignupRouter = void 0;
const express_1 = require("express");
const user_class_1 = require("../classes/user.class");
const multer_util_1 = require("../public/utils/multer.util");
const local_user_schema_1 = require("../database/schemas/local_user.schema");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
var router = (0, express_1.Router)();
router.post("/signup", multer_util_1.imageUpload.single("upload_user_avatar"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const email = (0, sanitize_html_1.default)(req.body.email);
    const password = (0, sanitize_html_1.default)(req.body.password);
    const username = (0, sanitize_html_1.default)(req.body.username).toLocaleLowerCase();
    const avatar = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
    const userEmail = yield local_user_schema_1.localUserModel.findOne({ email: email });
    if (userEmail) {
        req.flash("user_exists", "Email is already in use, please use a different one!");
        return res.redirect(301, "/signup");
    }
    const userUsername = yield local_user_schema_1.localUserModel.findOne({ username: username });
    if (userUsername) {
        req.flash("user_exists", "Username is already in use, please use a different one!");
        return res.redirect(301, "/signup");
    }
    try {
        const newUser = new user_class_1.User(email, password);
        yield newUser.setLocalUser();
        yield newUser.updateLocalUser(email, username, avatar);
        req.flash("acc_created", "Your account was successfully made, enter your credentials to login!");
        return res.redirect(301, "/login");
    }
    catch (err) {
        console.error(err);
    }
}));
exports.localSignupRouter = router;
//# sourceMappingURL=signup.router.js.map