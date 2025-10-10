import { Request } from "express";
import path from "path";
import multer from "multer";
import slugify from "slugify";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const whiteList = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const storageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/assets/users/uploads"));
  },
  filename: (req: Request, file, cb) => {
    const fileName = slugify(file.originalname, { lower: true });
    cb(null, `${new Date().getTime()}--${fileName}`);
  },
});

const upload = multer({
  storage: storageEngine,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req: Request, file, cb) => {
    if (!whiteList.includes(file.mimetype)) {
      return cb(new Error("This file is not allowed"));
    }
    cb(null, true);
  },
});

export const imageUpload = upload;