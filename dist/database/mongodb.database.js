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
exports.Database = void 0;
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_js_1 = require("../logger.js");
var Database;
(function (Database) {
    const db_name = `${process.env.MONGO_DB_NAME}`;
    const db_uri = `mongodb://${process.env.MONGOUSER}:${process.env.MONGOPASSWORD}@${process.env.MONGOHOST}:27017`;
    // Atlas connection requirement
    // const serverApi = {
    //     serverApi: {
    //         version: ServerApiVersion.v1,
    //         strict: true,
    //         deprecationErrors: true,
    //     },
    // };
    function _connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield mongoose_1.default.connect(db_uri);
                console.log("Successfully established connection to the database");
                logger_js_1.logger.info("Successfully established connection to the database");
            }
            catch (err) {
                console.error(`Failed to connect to the database ${err}`);
                logger_js_1.logger.error(`Failed to connect to the database ${err}`);
                process.exit();
            }
        });
    }
    Database._connect = _connect;
    mongoose_1.default.connection.on("connected", () => {
        console.log("Currently connected to: " + db_name + " db");
        logger_js_1.logger.info("Currently connected to: " + db_name + " db");
    });
    mongoose_1.default.connection.on("error", (err) => {
        console.error("Failed to connect to db " + db_name + " on start", err);
        logger_js_1.logger.error("Failed to connect to db " + db_name + " on start", err);
    });
    mongoose_1.default.connection.on("disconnected", () => {
        console.log("Mongoose default connection to db: " + db_name + " disconnected");
        logger_js_1.logger.warn("Mongoose default connection to db: " + db_name + " disconnected");
    });
    Database.gracefulExit = () => {
        console.log("Mongoose default connection with db: " +
            db_name +
            " is disconnected through app termination");
        logger_js_1.logger.warn("Mongoose default connection with db: " +
            db_name +
            " is disconnected through app termination");
        mongoose_1.default.connection.close();
    };
})(Database || (exports.Database = Database = {}));
//# sourceMappingURL=mongodb.database.js.map