"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const sessionsSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
    },
    expires: {
        type: Date,
    },
    session: {
        type: String,
    }
});
exports.sessions = mongoose_1.default.model("sessions", sessionsSchema);
//# sourceMappingURL=sessions.schema.js.map