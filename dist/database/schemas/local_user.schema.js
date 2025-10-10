"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localUserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let friendshipSchema = new mongoose_1.default.Schema({
    friendship_id: String,
    friend_id: String,
    status: Number,
    username: String,
    added_at: Date,
});
const userSchema = new mongoose_1.default.Schema({
    userID: {
        type: String,
        unique: true,
        immutable: true,
        required: true,
    },
    username: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        private: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
    },
    defaultAvatar: {
        type: String,
        default: "default_user_avatar.jpg",
    },
    avatar: {
        type: String,
        default: null,
    },
    description: {
        type: String,
        default: "No bio",
    },
    friendships: [friendshipSchema],
    status: {
        type: String,
        default: "offline",
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
/**
 * Update edited_at row on user update
 */
userSchema.pre("save", function (next) {
    this.edited_at = new Date();
    next();
});
exports.localUserModel = mongoose_1.default.model("local_users", userSchema);
//# sourceMappingURL=local_user.schema.js.map