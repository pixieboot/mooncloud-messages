"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const discordUserSchema = new mongoose_1.default.Schema({
    userID: {
        type: String,
        unique: true,
        immutable: true,
        required: true,
    },
    discordID: {
        type: String,
        unique: true,
        immutable: true,
        required: true,
    },
    discordEmail: {
        type: String,
        unique: true,
        required: true,
    },
    discordUsername: {
        type: String,
        unique: true,
    },
    discordAvatar: {
        type: String,
    },
    created_at: {
        type: Date,
        immutable: true,
        default: Date,
    },
    edited_at: {
        type: Date,
        default: Date,
    },
    deleted_at: {
        type: Date,
    },
});
discordUserSchema.pre("save", function (next) {
    this.edited_at = new Date();
    next();
});
const discordUserModel = mongoose_1.default.model("discord_users", discordUserSchema);
exports.default = discordUserModel;
//# sourceMappingURL=discord_user.schema.js.map