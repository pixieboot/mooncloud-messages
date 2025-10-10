"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendshipModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let userSchema = new mongoose_1.default.Schema({
    _id: String,
    username: String,
    email: String,
});
const friendshipSchema = new mongoose_1.default.Schema({
    friendship_id: String,
    requester: userSchema,
    receiver: userSchema,
    status: {
        type: Number,
        min: 0,
        max: 2,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        immutable: true,
        default: Date,
    },
});
exports.friendshipModel = mongoose_1.default.model("friendships", friendshipSchema);
//# sourceMappingURL=friendship.schema.js.map