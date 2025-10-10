"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const main_router_1 = require("./main.router");
const discord_router_1 = require("./discord.router");
const login_router_1 = require("./login.router");
const logout_router_1 = require("./logout.router");
const signup_router_1 = require("./signup.router");
const user_router_1 = require("./user.router");
router.use('/', main_router_1.mainRouter);
router.use('/auth/login', login_router_1.loginRouter);
router.use('/auth/logout', logout_router_1.logoutRouter);
router.use('/auth/signup', signup_router_1.localSignupRouter);
router.use('/auth/signup/discord', discord_router_1.discordRouter);
router.use('/user', user_router_1.userRouter);
exports.default = router;
//# sourceMappingURL=index.js.map