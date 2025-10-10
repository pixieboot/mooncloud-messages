import "dotenv/config";
import { ServerApiVersion } from "mongodb";
import mongoose from "mongoose";
import { logger } from "../logger";

export namespace Database {
    const db_name = `${process.env.MONGO_DB_NAME}`;
    const db_uri = `${process.env.MONGO_URI}`;
    const serverApi = {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    };

    export async function _connect() {
        try {
            await mongoose.connect(db_uri, {
                dbName: db_name
            });
            logger.info("Successfully established connection to the database");
        } catch (err) {
            logger.error(`Failed to connect to the database ${err}`);
            process.exit();
        }
    }

    mongoose.connection.on("connected", () => {
        logger.info("Currently connected to: " + db_name + " db");
    });

    mongoose.connection.on("error", (err) => {
        logger.error("Failed to connect to db " + db_name + " on start", err);
    });

    mongoose.connection.on("disconnected", () => {
        logger.warn(
            "Mongoose default connection to db: " + db_name + " disconnected"
        );
    });

    export var gracefulExit = () => {
        logger.warn(
            "Mongoose default connection with db: " +
            db_name +
            " is disconnected through app termination"
        );
        mongoose.connection.close();
    };
}
