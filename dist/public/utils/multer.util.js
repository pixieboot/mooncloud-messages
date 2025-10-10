"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageUpload = exports.whiteList = void 0;
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const slugify_1 = __importDefault(require("slugify"));
exports.whiteList = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
];
const storageEngine = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(__dirname, "../../public/assets/users/uploads"));
    },
    filename: (req, file, cb) => {
        const fileName = (0, slugify_1.default)(file.originalname, { lower: true });
        cb(null, `${new Date().getTime()}--${fileName}`);
    },
});
const upload = (0, multer_1.default)({
    storage: storageEngine,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!exports.whiteList.includes(file.mimetype)) {
            return cb(new Error("This file is not allowed"));
        }
        cb(null, true);
    },
});
exports.imageUpload = upload;
//# sourceMappingURL=multer.util.js.map