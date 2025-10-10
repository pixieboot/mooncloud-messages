"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
var router = (0, express_1.Router)();
router.get("/redirect", passport_1.default.authenticate("discord"), (req, res) => {
    res.sendStatus(200);
    res.redirect("/");
});
exports.discordRouter = router;
//# sourceMappingURL=discord.router.js.map