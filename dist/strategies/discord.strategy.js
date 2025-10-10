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
exports.authenticateDiscordUser = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_discord_1 = require("passport-discord");
require("dotenv/config");
const discord_user_schema_js_1 = __importDefault(require("../database/schemas/discord_user.schema.js"));
exports.authenticateDiscordUser = passport_1.default.use(new passport_discord_1.Strategy({
    clientID: `${process.env.CLIENT_ID}`,
    clientSecret: `${process.env.CLIENT_SECRET}`,
    callbackURL: "http://localhost:3000/auth/discord/redirect",
    scope: ["identify", "email"],
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(accessToken, refreshToken);
    console.log(profile);
    try {
        const discordUserDB = yield discord_user_schema_js_1.default.findOne({
            discordID: profile.id,
        });
        if (discordUserDB) {
            console.log(`Found user: ${discord_user_schema_js_1.default}`);
            return done(null, discordUserDB);
        }
        else {
            const newDiscordUser = yield discord_user_schema_js_1.default.create({
                discordID: profile.id,
                discordEmail: profile.email,
                discordUsername: profile.username,
            });
            console.log(`Created new user: ${newDiscordUser}`);
            return done(null, newDiscordUser);
        }
    }
    catch (err) {
        console.log(err);
        return done(err, false);
    }
})));
//# sourceMappingURL=discord.strategy.js.map